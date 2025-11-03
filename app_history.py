"""
Historical trend analysis endpoints for SpendSense
"""

from flask import jsonify, request
from datetime import datetime, timedelta
from db.database import get_db_connection
from db.models import (
    Recommendation, RecommendationView, RecommendationAcceptance,
    PersonaAssignment, BehavioralSignal, UserSession
)
import json


def register_history_routes(app):
    """Register historical trend analysis routes"""
    
    @app.route('/history/recommendations/<user_id>', methods=['GET'])
    def get_recommendation_history(user_id):
        """
        Get recommendation history for a user
        
        Query params:
        - limit: Number of recommendations to return (default: 50)
        - start_date: Start date filter (ISO format)
        - end_date: End date filter (ISO format)
        """
        limit = request.args.get('limit', 50, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = '''
                SELECT * FROM recommendations
                WHERE user_id = ?
            '''
            params = [user_id]
            
            if start_date:
                query += ' AND generated_at >= ?'
                params.append(start_date)
            if end_date:
                query += ' AND generated_at <= ?'
                params.append(end_date)
            
            query += ' ORDER BY generated_at DESC LIMIT ?'
            params.append(limit)
            
            cursor.execute(query, params)
            recommendations = [dict(row) for row in cursor.fetchall()]
            
            return jsonify({
                'user_id': user_id,
                'total': len(recommendations),
                'recommendations': recommendations
            })
    
    
    @app.route('/history/persona/<user_id>', methods=['GET'])
    def get_persona_history(user_id):
        """
        Get persona assignment history for a user
        
        Query params:
        - limit: Number of assignments to return (default: 30)
        """
        limit = request.args.get('limit', 30, type=int)
        
        history = PersonaAssignment.get_history(user_id, limit)
        
        return jsonify({
            'user_id': user_id,
            'total': len(history),
            'history': history
        })
    
    
    @app.route('/history/acceptance-rate', methods=['GET'])
    def get_acceptance_rate_trends():
        """
        Get recommendation acceptance rate trends over time
        
        Query params:
        - days: Number of days to analyze (default: 30)
        - user_id: Optional user ID filter
        """
        days = request.args.get('days', 30, type=int)
        user_id = request.args.get('user_id')
        
        start_date = datetime.now() - timedelta(days=days)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Daily acceptance rates
            query = '''
                SELECT 
                    DATE(viewed_at) as date,
                    COUNT(DISTINCT rv.view_id) as views,
                    COUNT(DISTINCT ra.acceptance_id) as acceptances,
                    CASE 
                        WHEN COUNT(DISTINCT rv.view_id) > 0 
                        THEN (COUNT(DISTINCT ra.acceptance_id) * 100.0 / COUNT(DISTINCT rv.view_id))
                        ELSE 0
                    END as acceptance_rate
                FROM recommendation_views rv
                LEFT JOIN recommendation_acceptances ra
                    ON rv.user_id = ra.user_id
                    AND rv.recommendation_title = ra.recommendation_title
                    AND DATE(rv.viewed_at) = DATE(ra.accepted_at)
                    AND ra.action = 'clicked'
                WHERE rv.viewed_at >= ?
            '''
            params = [start_date]
            
            if user_id:
                query += ' AND rv.user_id = ?'
                params.append(user_id)
            
            query += ' GROUP BY DATE(rv.viewed_at) ORDER BY date'
            
            cursor.execute(query, params)
            daily_rates = [dict(row) for row in cursor.fetchall()]
            
            # Overall stats
            overall_query = '''
                SELECT 
                    COUNT(DISTINCT rv.view_id) as total_views,
                    COUNT(DISTINCT ra.acceptance_id) as total_acceptances
                FROM recommendation_views rv
                LEFT JOIN recommendation_acceptances ra
                    ON rv.user_id = ra.user_id
                    AND rv.recommendation_title = ra.recommendation_title
                    AND ra.action = 'clicked'
                WHERE rv.viewed_at >= ?
            '''
            overall_params = [start_date]
            
            if user_id:
                overall_query += ' AND rv.user_id = ?'
                overall_params.append(user_id)
            
            cursor.execute(overall_query, overall_params)
            overall = dict(cursor.fetchone())
            
            overall_rate = (overall['total_acceptances'] / overall['total_views'] * 100) if overall['total_views'] > 0 else 0
            
            return jsonify({
                'period_days': days,
                'user_id': user_id,
                'overall': {
                    'total_views': overall['total_views'],
                    'total_acceptances': overall['total_acceptances'],
                    'acceptance_rate': round(overall_rate, 1)
                },
                'daily_rates': daily_rates
            })
    
    
    @app.route('/history/persona-distribution', methods=['GET'])
    def get_persona_distribution_history():
        """
        Get persona distribution trends over time
        
        Query params:
        - days: Number of days to analyze (default: 30)
        """
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Daily persona distribution
            query = '''
                SELECT 
                    DATE(assigned_at) as date,
                    primary_persona,
                    persona_name,
                    COUNT(*) as count
                FROM persona_assignments
                WHERE assigned_at >= ?
                GROUP BY DATE(assigned_at), primary_persona
                ORDER BY date DESC, count DESC
            '''
            
            cursor.execute(query, (start_date,))
            daily_distribution = [dict(row) for row in cursor.fetchall()]
            
            # Current distribution
            current_query = '''
                SELECT 
                    pa1.primary_persona,
                    pa1.persona_name,
                    COUNT(*) as count
                FROM persona_assignments pa1
                INNER JOIN (
                    SELECT user_id, MAX(assigned_at) as max_date
                    FROM persona_assignments
                    GROUP BY user_id
                ) pa2 ON pa1.user_id = pa2.user_id 
                    AND pa1.assigned_at = pa2.max_date
                GROUP BY pa1.primary_persona, pa1.persona_name
            '''
            
            cursor.execute(current_query)
            current_distribution = [dict(row) for row in cursor.fetchall()]
            
            total = sum(d['count'] for d in current_distribution)
            
            return jsonify({
                'period_days': days,
                'current_distribution': current_distribution,
                'total_users': total,
                'daily_distribution': daily_distribution
            })
    
    
    @app.route('/history/user-activity/<user_id>', methods=['GET'])
    def get_user_activity_history(user_id):
        """
        Get comprehensive activity history for a user
        
        Query params:
        - days: Number of days to analyze (default: 90)
        """
        days = request.args.get('days', 90, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        # Get persona history
        persona_history = PersonaAssignment.get_history(user_id)
        
        # Get recommendation history
        recommendations = Recommendation.get_by_user(user_id)
        
        # Get acceptance stats
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Views and acceptances
            cursor.execute('''
                SELECT 
                    COUNT(*) as views,
                    (SELECT COUNT(*) FROM recommendation_acceptances 
                     WHERE user_id = ? AND action = 'clicked') as acceptances
                FROM recommendation_views
                WHERE user_id = ?
            ''', (user_id, user_id))
            
            stats = dict(cursor.fetchone())
            acceptance_rate = (stats['acceptances'] / stats['views'] * 100) if stats['views'] > 0 else 0
            
            # Session activity
            cursor.execute('''
                SELECT COUNT(*) as sessions,
                       MIN(started_at) as first_session,
                       MAX(last_activity) as last_session
                FROM user_sessions
                WHERE user_id = ? AND is_active = 1
            ''', (user_id,))
            
            session_stats = dict(cursor.fetchone())
        
        return jsonify({
            'user_id': user_id,
            'period_days': days,
            'persona_history': persona_history[:30],  # Last 30 assignments
            'recommendations': len(recommendations),
            'recommendation_stats': {
                'views': stats['views'],
                'acceptances': stats['acceptances'],
                'acceptance_rate': round(acceptance_rate, 1)
            },
            'session_stats': session_stats
        })


# Session management endpoints
def register_session_routes(app):
    """Register session management routes"""
    
    @app.route('/session/create', methods=['POST'])
    def create_session():
        """Create a new user session"""
        req_data = request.get_json() or {}
        user_id = req_data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        
        # Generate session token
        import secrets
        session_token = secrets.token_urlsafe(32)
        
        # Create session (expires in 24 hours)
        expires_at = datetime.now() + timedelta(hours=24)
        session_id = UserSession.create(user_id, session_token, expires_at)
        
        return jsonify({
            'session_id': session_id,
            'session_token': session_token,
            'expires_at': expires_at.isoformat(),
            'user_id': user_id
        })
    
    
    @app.route('/session/validate', methods=['POST'])
    def validate_session():
        """Validate a session token"""
        req_data = request.get_json() or {}
        session_token = req_data.get('session_token')
        
        if not session_token:
            return jsonify({'error': 'session_token required'}), 400
        
        session = UserSession.get_by_token(session_token)
        
        if session:
            UserSession.update_activity(session_token)
            return jsonify({
                'valid': True,
                'session': session
            })
        else:
            return jsonify({
                'valid': False,
                'message': 'Session not found or expired'
            }), 401
    
    
    @app.route('/session/deactivate', methods=['POST'])
    def deactivate_session():
        """Deactivate a session"""
        req_data = request.get_json() or {}
        session_token = req_data.get('session_token')
        
        if not session_token:
            return jsonify({'error': 'session_token required'}), 400
        
        UserSession.deactivate(session_token)
        
        return jsonify({
            'message': 'Session deactivated',
            'session_token': session_token
        })
    
    
    @app.route('/session/user/<user_id>', methods=['GET'])
    def get_user_sessions(user_id):
        """Get active sessions for a user"""
        sessions = UserSession.get_active_sessions(user_id)
        
        return jsonify({
            'user_id': user_id,
            'active_sessions': len(sessions),
            'sessions': sessions
        })

