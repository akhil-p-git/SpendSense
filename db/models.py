"""
Database models for SpendSense
"""

import json
from datetime import datetime
from typing import Optional, Dict, Any
from .database import get_db_connection


class BaseModel:
    """Base model with common database operations"""
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create instance from dictionary"""
        instance = cls()
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        return instance
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert instance to dictionary"""
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}


class User(BaseModel):
    """User model"""
    
    def __init__(self, user_id: str, name: str, email: str,
                 income_level: Optional[str] = None,
                 consent: bool = False,
                 created_at: Optional[datetime] = None,
                 updated_at: Optional[datetime] = None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.income_level = income_level
        self.consent = consent
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    @staticmethod
    def save(user_id: str, name: str, email: str, income_level: Optional[str] = None,
             consent: bool = False):
        """Save or update user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (user_id, name, email, income_level, consent, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    name = excluded.name,
                    email = excluded.email,
                    income_level = excluded.income_level,
                    consent = excluded.consent,
                    updated_at = excluded.updated_at
            ''', (user_id, name, email, income_level, 1 if consent else 0, datetime.now()))
    
    @staticmethod
    def get(user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    @staticmethod
    def get_all() -> list:
        """Get all users"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users ORDER BY created_at')
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def update_consent(user_id: str, consent: bool):
        """Update user consent status"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users SET consent = ?, updated_at = ? WHERE user_id = ?
            ''', (1 if consent else 0, datetime.now(), user_id))


class Account(BaseModel):
    """Account model"""
    
    @staticmethod
    def save(account_id: str, user_id: str, account_type: str, subtype: Optional[str] = None,
             balance_current: float = 0, balance_available: Optional[float] = None,
             balance_limit: Optional[float] = None, iso_currency_code: str = 'USD',
             holder_category: Optional[str] = None):
        """Save or update account"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO accounts (account_id, user_id, type, subtype, balance_current,
                    balance_available, balance_limit, iso_currency_code, holder_category, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(account_id) DO UPDATE SET
                    balance_current = excluded.balance_current,
                    balance_available = excluded.balance_available,
                    balance_limit = excluded.balance_limit,
                    updated_at = excluded.updated_at
            ''', (account_id, user_id, account_type, subtype, balance_current,
                  balance_available, balance_limit, iso_currency_code, holder_category,
                  datetime.now()))
    
    @staticmethod
    def get_by_user(user_id: str) -> list:
        """Get all accounts for a user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM accounts WHERE user_id = ?', (user_id,))
            return [dict(row) for row in cursor.fetchall()]


class Transaction(BaseModel):
    """Transaction model"""
    
    @staticmethod
    def save(transaction_id: str, account_id: str, date: Any, amount: float,
             merchant_name: Optional[str] = None, payment_channel: Optional[str] = None,
             category_primary: Optional[str] = None, category_detailed: Optional[str] = None,
             pending: bool = False):
        """Save transaction"""
        if isinstance(date, str):
            date = datetime.fromisoformat(date).date()
        elif isinstance(date, datetime):
            date = date.date()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO transactions
                (transaction_id, account_id, date, amount, merchant_name, payment_channel,
                 category_primary, category_detailed, pending)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (transaction_id, account_id, date, amount, merchant_name,
                  payment_channel, category_primary, category_detailed, 1 if pending else 0))
    
    @staticmethod
    def get_by_account(account_id: str, limit: Optional[int] = None) -> list:
        """Get transactions for an account"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = 'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC'
            if limit:
                query += f' LIMIT {limit}'
            cursor.execute(query, (account_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_by_user(user_id: str, limit: Optional[int] = None) -> list:
        """Get transactions for a user (across all accounts)"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = '''
                SELECT t.* FROM transactions t
                JOIN accounts a ON t.account_id = a.account_id
                WHERE a.user_id = ?
                ORDER BY t.date DESC
            '''
            if limit:
                query += f' LIMIT {limit}'
            cursor.execute(query, (user_id,))
            return [dict(row) for row in cursor.fetchall()]


class Liability(BaseModel):
    """Liability model"""
    
    @staticmethod
    def save(account_id: str, user_id: str, liability_type: Optional[str] = None,
             apr: Optional[float] = None, minimum_payment: Optional[float] = None,
             last_payment_date: Optional[Any] = None, last_payment_amount: Optional[float] = None):
        """Save liability"""
        if isinstance(last_payment_date, str):
            last_payment_date = datetime.fromisoformat(last_payment_date).date()
        elif isinstance(last_payment_date, datetime):
            last_payment_date = last_payment_date.date()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO liabilities
                (account_id, user_id, type, apr, minimum_payment, last_payment_date, last_payment_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (account_id, user_id, liability_type, apr, minimum_payment,
                  last_payment_date, last_payment_amount))
    
    @staticmethod
    def get_by_user(user_id: str) -> list:
        """Get liabilities for a user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM liabilities WHERE user_id = ?', (user_id,))
            return [dict(row) for row in cursor.fetchall()]


class PersonaAssignment(BaseModel):
    """Persona assignment model"""
    
    @staticmethod
    def save(user_id: str, primary_persona: Optional[str], persona_name: Optional[str],
             primary_focus: Optional[str], rationale: Optional[str]):
        """Save persona assignment"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO persona_assignments
                (user_id, primary_persona, persona_name, primary_focus, rationale)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, primary_persona, persona_name, primary_focus, rationale))
    
    @staticmethod
    def get_latest(user_id: str) -> Optional[Dict]:
        """Get latest persona assignment for user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM persona_assignments
                WHERE user_id = ?
                ORDER BY assigned_at DESC
                LIMIT 1
            ''', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def get_history(user_id: str, limit: Optional[int] = None) -> list:
        """Get persona assignment history for user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = '''
                SELECT * FROM persona_assignments
                WHERE user_id = ?
                ORDER BY assigned_at DESC
            '''
            if limit:
                query += f' LIMIT {limit}'
            cursor.execute(query, (user_id,))
            return [dict(row) for row in cursor.fetchall()]


class BehavioralSignal(BaseModel):
    """Behavioral signal model"""
    
    @staticmethod
    def save(user_id: str, signal_type: str, signal_data: Dict[str, Any]):
        """Save behavioral signal"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO behavioral_signals (user_id, signal_type, signal_data)
                VALUES (?, ?, ?)
            ''', (user_id, signal_type, json.dumps(signal_data)))
    
    @staticmethod
    def get_latest(user_id: str) -> Optional[Dict]:
        """Get latest signals for user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM behavioral_signals
                WHERE user_id = ?
                ORDER BY detected_at DESC
            ''', (user_id,))
            rows = cursor.fetchall()
            if rows:
                # Aggregate signals by type
                signals = {}
                for row in rows:
                    signal_type = row['signal_type']
                    if signal_type not in signals:
                        signals[signal_type] = json.loads(row['signal_data'])
                return {'user_id': user_id, 'signals': signals}
            return None


class Recommendation(BaseModel):
    """Recommendation model"""
    
    @staticmethod
    def save(user_id: str, title: str, description: Optional[str], url: Optional[str],
             rec_type: str, rationale: Optional[str], persona: Optional[str],
             decision_trace: Optional[list] = None):
        """Save recommendation"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            decision_trace_json = json.dumps(decision_trace) if decision_trace else None
            cursor.execute('''
                INSERT INTO recommendations
                (user_id, title, description, url, type, rationale, persona, decision_trace)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, title, description, url, rec_type, rationale, persona, decision_trace_json))
            return cursor.lastrowid
    
    @staticmethod
    def get_by_user(user_id: str, limit: Optional[int] = None) -> list:
        """Get recommendations for user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = '''
                SELECT * FROM recommendations
                WHERE user_id = ?
                ORDER BY generated_at DESC
            '''
            if limit:
                query += f' LIMIT {limit}'
            cursor.execute(query, (user_id,))
            return [dict(row) for row in cursor.fetchall()]


class RecommendationView(BaseModel):
    """Recommendation view model"""
    
    @staticmethod
    def save(user_id: str, recommendation_id: Optional[int], recommendation_title: str,
             rec_type: str, persona: Optional[str]):
        """Save recommendation view"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO recommendation_views
                (user_id, recommendation_id, recommendation_title, type, persona)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, recommendation_id, recommendation_title, rec_type, persona))
    
    @staticmethod
    def get_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict:
        """Get recommendation view statistics"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = 'SELECT COUNT(*) as total FROM recommendation_views WHERE 1=1'
            params = []
            
            if start_date:
                query += ' AND viewed_at >= ?'
                params.append(start_date)
            if end_date:
                query += ' AND viewed_at <= ?'
                params.append(end_date)
            
            cursor.execute(query, params)
            total = cursor.fetchone()['total']
            
            # By type
            query = query.replace('COUNT(*) as total', 'type, COUNT(*) as count')
            query += ' GROUP BY type'
            cursor.execute(query, params)
            by_type = {row['type']: row['count'] for row in cursor.fetchall()}
            
            return {'total': total, 'by_type': by_type}


class RecommendationAcceptance(BaseModel):
    """Recommendation acceptance model"""
    
    @staticmethod
    def save(user_id: str, recommendation_id: Optional[int], recommendation_title: str,
             rec_type: str, persona: Optional[str], action: str = 'clicked'):
        """Save recommendation acceptance"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO recommendation_acceptances
                (user_id, recommendation_id, recommendation_title, type, persona, action)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, recommendation_id, recommendation_title, rec_type, persona, action))
    
    @staticmethod
    def get_acceptance_rate(start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None) -> Dict:
        """Get acceptance rate statistics"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Total views
            views_query = 'SELECT COUNT(*) as total FROM recommendation_views WHERE 1=1'
            views_params = []
            if start_date:
                views_query += ' AND viewed_at >= ?'
                views_params.append(start_date)
            if end_date:
                views_query += ' AND viewed_at <= ?'
                views_params.append(end_date)
            
            cursor.execute(views_query, views_params)
            total_views = cursor.fetchone()['total']
            
            # Total acceptances
            accepts_query = 'SELECT COUNT(*) as total FROM recommendation_acceptances WHERE action = ?'
            accepts_params = ['clicked']
            if start_date:
                accepts_query += ' AND accepted_at >= ?'
                accepts_params.append(start_date)
            if end_date:
                accepts_query += ' AND accepted_at <= ?'
                accepts_params.append(end_date)
            
            cursor.execute(accepts_query, accepts_params)
            total_acceptances = cursor.fetchone()['total']
            
            acceptance_rate = (total_acceptances / total_views * 100) if total_views > 0 else 0
            
            return {
                'total_views': total_views,
                'total_acceptances': total_acceptances,
                'acceptance_rate': round(acceptance_rate, 1)
            }


class UserSession(BaseModel):
    """User session model"""
    
    @staticmethod
    def create(user_id: str, session_token: str, expires_at: Optional[datetime] = None) -> int:
        """Create new session"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_sessions (user_id, session_token, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, session_token, expires_at))
            return cursor.lastrowid
    
    @staticmethod
    def get_by_token(session_token: str) -> Optional[Dict]:
        """Get session by token"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM user_sessions
                WHERE session_token = ? AND is_active = 1
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ''', (session_token,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def update_activity(session_token: str):
        """Update session last activity"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE user_sessions
                SET last_activity = CURRENT_TIMESTAMP
                WHERE session_token = ?
            ''', (session_token,))
    
    @staticmethod
    def deactivate(session_token: str):
        """Deactivate session"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE user_sessions
                SET is_active = 0
                WHERE session_token = ?
            ''', (session_token,))
    
    @staticmethod
    def get_active_sessions(user_id: str) -> list:
        """Get active sessions for user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM user_sessions
                WHERE user_id = ? AND is_active = 1
                ORDER BY last_activity DESC
            ''', (user_id,))
            return [dict(row) for row in cursor.fetchall()]

