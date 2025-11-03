"""
SpendSense Main Application
Flask API for personalized financial recommendations
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import json
import time
import os
from datetime import datetime

from ingest.data_generator import generate_synthetic_data
from features.signal_detection import detect_behavioral_signals
from personas.persona_assignment import assign_persona, get_persona_rationale
from recommend.recommendation_engine import generate_recommendations
from recommend.what_if_simulator import WhatIfSimulator
from recommend.scenario_export import export_scenario_json, export_scenario_pdf
from flask import Response
from guardrails.consent import check_consent, validate_consent_for_processing
from eval.metrics import (
    calculate_coverage,
    calculate_explainability,
    calculate_latency,
    calculate_auditability,
    generate_evaluation_report,
    save_evaluation_report
)

# Database imports
from db.database import init_db, check_db_exists
from db.utils import get_all_data, get_users_df, get_user_transactions_df, get_user_accounts_df, get_user_liabilities_df
from db.models import (
    User, Account, Transaction, Liability,
    Recommendation, RecommendationView, RecommendationAcceptance,
    PersonaAssignment, BehavioralSignal, UserSession
)

app = Flask(__name__, static_folder='ui', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type"], "methods": ["GET", "POST", "OPTIONS"]}})

# Initialize database
print("Initializing SpendSense...")
init_db()

# Load or generate data
if check_db_exists():
    # Check if database has data
    try:
        users_df = get_users_df()
        if len(users_df) == 0:
            print("Database exists but is empty, generating data...")
            generate_synthetic_data(num_users=75, save_to_db=True)
            print("✓ Data generated and loaded into database")
        else:
            print(f"✓ Database loaded with {len(users_df)} users")
    except Exception as e:
        print(f"Error loading from database: {e}, generating new data...")
        generate_synthetic_data(num_users=75, save_to_db=True)
        print("✓ Data generated and loaded into database")
else:
    print("Generating new data...")
    generate_synthetic_data(num_users=75, save_to_db=True)
    print("✓ Data generated and loaded into database")

# Helper function to get data (compatibility with existing code)
def get_data():
    """Get data from database as DataFrames"""
    return get_all_data()

# Track app start time for uptime calculation
app_start_time = datetime.now()

# In-memory tracking for quick access (also saved to DB)
timings_history = []


@app.route('/')
def home():
    """Serve the frontend UI"""
    return send_from_directory('ui', 'index.html')


@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'SpendSense API is running',
        'endpoints': {
            'GET /users': 'List all users',
            'GET /profile/<user_id>': 'Get user behavioral profile',
            'GET /recommendations/<user_id>': 'Get personalized recommendations',
            'POST /what-if': 'Run what-if scenario simulation'
        }
    })


@app.route('/users', methods=['GET'])
def list_users():
    """List all users with consent status"""
    users_list = User.get_all()
    users = [
        {
            'user_id': u['user_id'],
            'name': u['name'],
            'email': u['email'],
            'consent': bool(u['consent'])
        }
        for u in users_list
    ]
    return jsonify({
        'total_users': len(users),
        'users': users
    })


@app.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    """
    Get behavioral profile for a user

    Returns signals, persona assignment, and rationale
    """
    # Check if user exists
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check consent using guardrails
    users_df = get_users_df()
    is_valid, error_msg = validate_consent_for_processing(user_id, users_df)
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Get data from database
    data = get_data()

    # Detect behavioral signals
    start_time = time.time()
    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    # Assign persona
    persona = assign_persona(signals)

    # Get rationale
    rationale = get_persona_rationale(
        persona['primary_persona'],
        signals
    ) if persona['primary_persona'] else None

    # Track for evaluation (in-memory for quick access)
    latency = time.time() - start_time
    timings_history.append({
        'user_id': user_id,
        'endpoint': 'profile',
        'latency_seconds': latency,
        'timestamp': datetime.now().isoformat()
    })
    
    # Save to database
    if persona.get('primary_persona'):
        PersonaAssignment.save(
            user_id=user_id,
            primary_persona=persona['primary_persona'],
            persona_name=persona.get('persona_name'),
            primary_focus=persona.get('primary_focus'),
            rationale=rationale
        )
        
        # Save signals to database
        for signal_type, signal_data in signals.items():
            if signal_data:
                BehavioralSignal.save(user_id, signal_type, signal_data)

    return jsonify({
        'user_id': user_id,
        'name': user['name'],
        'signals': signals,
        'persona': persona,
        'rationale': rationale
    })


@app.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Get personalized recommendations for a user

    Includes education content and partner offers with rationales
    """
    # Check if user exists
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check consent using guardrails
    users_df = get_users_df()
    is_valid, error_msg = validate_consent_for_processing(user_id, users_df)
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Track timing for evaluation
    start_time = time.time()

    # Get data from database
    data = get_data()

    # Get signals and persona
    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    persona = assign_persona(signals)

    # Generate recommendations (now with guardrails built-in)
    recommendations = generate_recommendations(
        user_id,
        persona,
        signals,
        data['accounts']
    )

    # Track for evaluation
    latency = time.time() - start_time
    timings_history.append({
        'user_id': user_id,
        'endpoint': 'recommendations',
        'latency_seconds': latency,
        'timestamp': datetime.now().isoformat()
    })

    # Save recommendations to database and track views
    all_recs = recommendations.get('education', []) + recommendations.get('offers', [])
    for rec in all_recs:
        # Save recommendation to database
        rec_id = Recommendation.save(
            user_id=user_id,
            title=rec.get('title', 'Unknown'),
            description=rec.get('description'),
            url=rec.get('url'),
            rec_type=rec.get('type', 'education'),
            rationale=rec.get('rationale'),
            persona=persona.get('persona_name'),
            decision_trace=rec.get('decision_trace')
        )
        
        # Track view in database
        RecommendationView.save(
            user_id=user_id,
            recommendation_id=rec_id,
            recommendation_title=rec.get('title', 'Unknown'),
            rec_type=rec.get('type', 'education'),
            persona=persona.get('persona_name')
        )

    return jsonify(recommendations)


@app.route('/what-if/export', methods=['POST'])
def export_scenario():
    """
    Export scenario result as PDF or JSON
    
    Request body:
    {
        "scenario_result": {...},
        "user_id": "user_0001",
        "format": "pdf" | "json"
    }
    """
    req_data = request.get_json() or {}
    scenario_result = req_data.get('scenario_result')
    user_id = req_data.get('user_id')
    format_type = req_data.get('format', 'json').lower()
    
    if not scenario_result or not user_id:
        return jsonify({'error': 'scenario_result and user_id required'}), 400
    
    try:
        if format_type == 'pdf':
            pdf_buffer = export_scenario_pdf(scenario_result, user_id)
            return Response(
                pdf_buffer.read(),
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename=scenario_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
                }
            )
        elif format_type == 'json':
            json_str = export_scenario_json(scenario_result, user_id)
            return Response(
                json_str,
                mimetype='application/json',
                headers={
                    'Content-Disposition': f'attachment; filename=scenario_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                }
            )
        else:
            return jsonify({'error': 'Invalid format. Use "pdf" or "json"'}), 400
    except ImportError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500


@app.route('/what-if', methods=['POST'])
def what_if_simulation():
    """
    Run what-if scenario simulation

    Request body:
    {
        "user_id": "user_0001",
        "scenario_type": "extra_credit_payment" | "subscription_cancellation" | "increased_savings" | "combined",
        "params": {...}
    }

    Examples:
    - Extra payment: {"account_id": "...", "extra_monthly_payment": 200, "months": 12}
    - Subscriptions: {"subscriptions_to_cancel": [{"name": "Netflix", "amount": 15.99}], "months": 12}
    - Savings: {"monthly_amount": 500, "target_amount": 10000, "months": 12}
    """
    req_data = request.get_json()

    user_id = req_data.get('user_id')
    scenario_type = req_data.get('scenario_type')
    params = req_data.get('params', {})

    # Validate user
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user['consent']:
        return jsonify({'error': 'User has not provided consent'}), 403

    # Get data from database
    data = get_data()
    
    # Get user data
    user_accounts_df = get_user_accounts_df(user_id)
    user_liabilities_df = get_user_liabilities_df(user_id)

    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    # Initialize simulator
    simulator = WhatIfSimulator(signals, user_accounts_df, user_liabilities_df)

    # Run appropriate simulation
    try:
        if scenario_type == 'extra_credit_payment':
            account_id = params.get('account_id')
            if not account_id:
                # Try to find a credit card account automatically
                credit_cards = user_accounts_df[user_accounts_df['type'] == 'credit card']
                if credit_cards.empty:
                    return jsonify({'error': 'No credit card account found for user'}), 400
                account_id = credit_cards.iloc[0]['account_id']
            
            result = simulator.simulate_extra_credit_payment(
                account_id,
                params.get('extra_monthly_payment', 100),
                params.get('months', 12)
            )

        elif scenario_type == 'subscription_cancellation':
            result = simulator.simulate_subscription_cancellation(
                params.get('subscriptions_to_cancel', []),
                params.get('months', 12)
            )

        elif scenario_type == 'increased_savings':
            result = simulator.simulate_increased_savings(
                params.get('monthly_amount', 100),
                params.get('target_amount'),
                params.get('months', 12)
            )

        elif scenario_type == 'combined':
            result = simulator.simulate_combined_scenario(
                params.get('scenarios', []),
                params.get('months', 12)
            )

        elif scenario_type == 'goal_based_payment':
            account_id = params.get('account_id')
            if not account_id:
                # Try to find a credit card account automatically
                credit_cards = user_accounts_df[user_accounts_df['type'] == 'credit card']
                if credit_cards.empty:
                    return jsonify({'error': 'No credit card account found for user'}), 400
                account_id = credit_cards.iloc[0]['account_id']
            
            result = simulator.calculate_goal_based_payment(
                account_id,
                params.get('target_months', 12),
                params.get('max_monthly_payment')
            )

        elif scenario_type == 'compare':
            # Compare two scenarios
            scenario_a_params = params.get('scenario_a', {})
            scenario_b_params = params.get('scenario_b', {})
            
            # Get default account_id for credit payment scenarios
            default_account_id = None
            credit_cards = user_accounts_df[user_accounts_df['type'] == 'credit card']
            if not credit_cards.empty:
                default_account_id = credit_cards.iloc[0]['account_id']
            
            # Run scenario A
            if scenario_a_params.get('type') == 'extra_credit_payment':
                acc_id_a = scenario_a_params.get('account_id') or default_account_id
                if not acc_id_a:
                    return jsonify({'error': 'No credit card account found for scenario A'}), 400
                scenario_a = simulator.simulate_extra_credit_payment(
                    acc_id_a,
                    scenario_a_params.get('amount', 100),
                    scenario_a_params.get('months', 12)
                )
            elif scenario_a_params.get('type') == 'subscription_cancellation':
                scenario_a = simulator.simulate_subscription_cancellation(
                    scenario_a_params.get('subscriptions', []),
                    scenario_a_params.get('months', 12)
                )
            elif scenario_a_params.get('type') == 'increased_savings':
                scenario_a = simulator.simulate_increased_savings(
                    scenario_a_params.get('amount', 100),
                    scenario_a_params.get('target_amount'),
                    scenario_a_params.get('months', 12)
                )
            else:
                return jsonify({'error': 'Invalid scenario_a type'}), 400
            
            # Run scenario B
            if scenario_b_params.get('type') == 'extra_credit_payment':
                acc_id_b = scenario_b_params.get('account_id') or default_account_id
                if not acc_id_b:
                    return jsonify({'error': 'No credit card account found for scenario B'}), 400
                scenario_b = simulator.simulate_extra_credit_payment(
                    acc_id_b,
                    scenario_b_params.get('amount', 100),
                    scenario_b_params.get('months', 12)
                )
            elif scenario_b_params.get('type') == 'subscription_cancellation':
                scenario_b = simulator.simulate_subscription_cancellation(
                    scenario_b_params.get('subscriptions', []),
                    scenario_b_params.get('months', 12)
                )
            elif scenario_b_params.get('type') == 'increased_savings':
                scenario_b = simulator.simulate_increased_savings(
                    scenario_b_params.get('amount', 100),
                    scenario_b_params.get('target_amount'),
                    scenario_b_params.get('months', 12)
                )
            else:
                return jsonify({'error': 'Invalid scenario_b type'}), 400
            
            result = simulator.compare_scenarios(scenario_a, scenario_b)

        else:
            return jsonify({'error': 'Invalid scenario_type'}), 400

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/consent', methods=['POST'])
def update_consent():
    """
    Update user consent status

    Request body:
    {
        "user_id": "user_0001",
        "consent": true
    }
    """
    from guardrails.consent import update_consent_status
    
    req_data = request.get_json()
    user_id = req_data.get('user_id')
    consent = req_data.get('consent')

    # Update consent in database
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    User.update_consent(user_id, consent)
    
    # Also update using guardrails module for compatibility
    users_df = get_users_df()
    update_consent_status(user_id, consent, users_df)

    return jsonify({
        'user_id': user_id,
        'consent': consent,
        'message': 'Consent updated successfully'
    })


@app.route('/eval/report', methods=['GET'])
def get_evaluation_report():
    """
    Generate and return evaluation report
    
    Returns coverage, explainability, latency, and auditability metrics
    """
    # Convert histories to DataFrames for evaluation
    if not personas_history:
        return jsonify({
            'error': 'No evaluation data available yet',
            'message': 'Make some API calls to generate evaluation data'
        }), 400

    personas_df = pd.DataFrame(personas_history)
    
    # Create signals DataFrame
    if signals_history:
        signals_df = pd.DataFrame([
            {
                'user_id': s['user_id'],
                'signal_count': len(s['signals'].get('subscriptions', {})) +
                               len(s['signals'].get('savings', {})) +
                               len(s['signals'].get('credit', {})) +
                               len(s['signals'].get('income', {}))
            }
            for s in signals_history
        ])
    else:
        signals_df = pd.DataFrame()

    # Generate report
    report = generate_evaluation_report(
        users_df=data['users'],
        personas_df=personas_df,
        signals_df=signals_df,
        recommendations_list=recommendations_history,
        timings_list=timings_history
    )

    return jsonify(report)


@app.route('/users/<user_id>/accounts', methods=['GET'])
def get_user_accounts(user_id):
    """
    Get accounts for a user
    
    Returns user's accounts with details
    """
    # Check if user exists
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check consent
    users_df = get_users_df()
    is_valid, error_msg = validate_consent_for_processing(user_id, users_df)
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Get user's accounts
    user_accounts = Account.get_by_user(user_id)
    
    # Format for frontend
    accounts = []
    for acc in user_accounts:
        accounts.append({
            'account_id': acc['account_id'],
            'type': acc['type'],
            'subtype': acc.get('subtype', acc['type']),
            'balance_current': float(acc['balance_current']),
            'balance_available': float(acc['balance_available']) if acc.get('balance_available') is not None else None,
            'balance_limit': float(acc['balance_limit']) if acc.get('balance_limit') is not None else None,
            'iso_currency_code': acc.get('iso_currency_code', 'USD')
        })
    
    return jsonify({
        'user_id': user_id,
        'total_accounts': len(accounts),
        'accounts': accounts
    })


@app.route('/transactions/<user_id>', methods=['GET'])
def get_transactions(user_id):
    """
    Get recent transactions for a user
    
    Returns last 30 transactions
    """
    # Check if user exists
    user = User.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check consent
    users_df = get_users_df()
    is_valid, error_msg = validate_consent_for_processing(user_id, users_df)
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Get transactions from database
    user_transactions = Transaction.get_by_user(user_id, limit=30)
    
    # Format for frontend
    transactions = []
    for txn in user_transactions:
        date = txn['date']
        if isinstance(date, str):
            date_str = date
        else:
            date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
        
        transactions.append({
            'transaction_id': txn['transaction_id'],
            'date': date_str,
            'merchant_name': txn.get('merchant_name'),
            'amount': float(txn['amount']),
            'category_primary': txn.get('category_primary'),
            'category_detailed': txn.get('category_detailed'),
            'payment_channel': txn.get('payment_channel', 'unknown')
        })
    
    return jsonify({
        'user_id': user_id,
        'total_transactions': len(transactions),
        'transactions': transactions
    })


@app.route('/eval/save', methods=['POST'])
def save_evaluation():
    """
    Save evaluation report to file
    
    Request body (optional):
    {
        "output_path": "data/evaluation_report.json"
    }
    """
    req_data = request.get_json() or {}
    output_path = req_data.get('output_path', 'data/evaluation_report.json')

    # Get data from database for evaluation
    from db.database import get_db_connection
    
    with get_db_connection() as conn:
        # Get persona assignments from database
        personas_df = pd.read_sql_query('SELECT * FROM persona_assignments', conn)
        
        # Get behavioral signals
        signals_df = pd.read_sql_query('SELECT * FROM behavioral_signals', conn)
        if not signals_df.empty:
            # Count signals per user
            signals_df = signals_df.groupby('user_id').size().reset_index(name='signal_count')
        else:
            signals_df = pd.DataFrame(columns=['user_id', 'signal_count'])
        
        # Get recommendations from database
        recommendations_list = []
        recs_df = pd.read_sql_query('SELECT * FROM recommendations', conn)
        for _, rec in recs_df.iterrows():
            recommendations_list.append({
                'rationale': rec.get('rationale'),
                'decision_trace': json.loads(rec.get('decision_trace') or '[]')
            })
    
    # Get users data
    users_df = get_users_df()
    
    report = generate_evaluation_report(
        users_df=users_df,
        personas_df=personas_df,
        signals_df=signals_df,
        recommendations_list=recommendations_list,
        timings_list=timings_history
    )

    save_evaluation_report(report, output_path)

    return jsonify({
        'message': 'Evaluation report saved',
        'path': output_path,
        'report': report
    })


# ========== OPERATOR ANALYTICS ENDPOINTS ==========

@app.route('/operator/persona-distribution', methods=['GET'])
def get_persona_distribution():
    """
    Get persona distribution across all users
    
    Returns pie chart data for persona distribution
    """
    from db.database import get_db_connection
    
    with get_db_connection() as conn:
        # Get latest persona assignment for each user
        query = '''
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
        personas_df = pd.read_sql_query(query, conn)
    
    if personas_df.empty:
        return jsonify({
            'error': 'No persona data available yet',
            'distribution': {}
        }), 200
    
    # Count personas
    persona_counts = personas_df.set_index('primary_persona')['count'].to_dict()
    
    # Map persona IDs to names
    persona_names = {
        'high_utilization': 'High Utilization',
        'variable_income': 'Variable Income',
        'subscription_heavy': 'Subscription-Heavy',
        'emergency_fund_starter': 'Emergency Fund Starter',
        'savings_builder': 'Savings Builder'
    }
    
    # Format for chart
    distribution = {}
    total = sum(persona_counts.values())
    
    for persona_id, count in persona_counts.items():
        persona_name = persona_names.get(persona_id, persona_id.replace('_', ' ').title())
        distribution[persona_name] = {
            'count': int(count),
            'percentage': round((count / total * 100) if total > 0 else 0, 1)
        }
    
    return jsonify({
        'total_users': total,
        'distribution': distribution
    })


@app.route('/operator/recommendation-tracking', methods=['GET'])
def get_recommendation_tracking():
    """
    Get recommendation acceptance tracking metrics
    
    Returns views, acceptance rate, by type, etc.
    """
    from db.database import get_db_connection
    
    with get_db_connection() as conn:
        views_df = pd.read_sql_query('SELECT * FROM recommendation_views', conn)
        acceptances_df = pd.read_sql_query('SELECT * FROM recommendation_acceptances WHERE action = ?', conn, params=('clicked',))
    
    if views_df.empty:
        return jsonify({
            'total_views': 0,
            'total_acceptances': 0,
            'acceptance_rate': 0.0,
            'by_type': {},
            'by_persona': {}
        })
    
    # Calculate metrics
    total_views = len(views_df)
    total_acceptances = len(acceptances_df)
    acceptance_rate = (total_acceptances / total_views * 100) if total_views > 0 else 0.0
    
    # By type
    by_type = {}
    if not views_df.empty:
        type_counts = views_df['type'].value_counts().to_dict()
        for rec_type, count in type_counts.items():
            accepted_count = len(acceptances_df[acceptances_df['type'] == rec_type]) if not acceptances_df.empty else 0
            by_type[rec_type] = {
                'views': int(count),
                'acceptances': int(accepted_count),
                'acceptance_rate': round((accepted_count / count * 100) if count > 0 else 0, 1)
            }
    
    # By persona
    by_persona = {}
    if not views_df.empty:
        persona_counts = views_df['persona'].value_counts().to_dict()
        for persona, count in persona_counts.items():
            accepted_count = len(acceptances_df[acceptances_df.get('persona') == persona]) if not acceptances_df.empty else 0
            by_persona[persona] = {
                'views': int(count),
                'acceptances': int(accepted_count),
                'acceptance_rate': round((accepted_count / count * 100) if count > 0 else 0, 1)
            }
    
    return jsonify({
        'total_views': total_views,
        'total_acceptances': total_acceptances,
        'acceptance_rate': round(acceptance_rate, 1),
        'by_type': by_type,
        'by_persona': by_persona
    })


@app.route('/operator/recommendation/accept', methods=['POST'])
def track_recommendation_acceptance():
    """
    Track when a user accepts/clicks on a recommendation
    
    Request body:
    {
        "user_id": "user_0001",
        "recommendation_id": "rec_123",
        "type": "education",
        "action": "clicked"  # or "dismissed"
    }
    """
    req_data = request.get_json() or {}
    
    user_id = req_data.get('user_id')
    recommendation_id = req_data.get('recommendation_id')
    rec_type = req_data.get('type', 'unknown')
    action = req_data.get('action', 'clicked')
    
    if not user_id or not recommendation_id:
        return jsonify({'error': 'user_id and recommendation_id required'}), 400
    
    # Get user's persona for tracking
    persona = 'unknown'
    latest_persona = PersonaAssignment.get_latest(user_id)
    if latest_persona:
        persona = latest_persona.get('persona_name', 'unknown')
    
    # Track acceptance in database
    if action == 'clicked':
        RecommendationAcceptance.save(
            user_id=user_id,
            recommendation_id=None,  # May not have DB recommendation_id if old data
            recommendation_title=recommendation_id,
            rec_type=rec_type,
            persona=persona,
            action=action
        )
    
    acceptance = {
        'user_id': user_id,
        'recommendation_id': recommendation_id,
        'type': rec_type,
        'persona': persona,
        'action': action,
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify({
        'message': 'Recommendation acceptance tracked',
        'acceptance': acceptance
    })


@app.route('/operator/system-health', methods=['GET'])
def get_system_health():
    """
    Get system health metrics
    
    Returns API uptime, average latency, error rates, etc.
    """
    # Calculate latency metrics
    if timings_history:
        latencies = [t['latency_seconds'] for t in timings_history]
        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)
        min_latency = min(latencies)
    else:
        avg_latency = 0
        max_latency = 0
        min_latency = 0
    
    # User stats
    users_df = get_users_df()
    total_users = len(users_df)
    users_with_consent = len(users_df[users_df['consent'] == True])
    consent_rate = (users_with_consent / total_users * 100) if total_users > 0 else 0
    
    # Recommendation stats from database
    from db.database import get_db_connection
    with get_db_connection() as conn:
        total_recs_df = pd.read_sql_query('SELECT COUNT(*) as total FROM recommendations', conn)
        total_views_df = pd.read_sql_query('SELECT COUNT(*) as total FROM recommendation_views', conn)
        total_accepts_df = pd.read_sql_query('SELECT COUNT(*) as total FROM recommendation_acceptances WHERE action = ?', conn, params=('clicked',))
    
    total_recommendations = total_recs_df.iloc[0]['total'] if not total_recs_df.empty else 0
    total_views = total_views_df.iloc[0]['total'] if not total_views_df.empty else 0
    total_acceptances = total_accepts_df.iloc[0]['total'] if not total_accepts_df.empty else 0
    
    # API call stats
    total_api_calls = len(timings_history)
    
    return jsonify({
        'uptime_seconds': (datetime.now() - app_start_time).total_seconds(),
        'latency': {
            'avg_seconds': round(avg_latency, 3),
            'max_seconds': round(max_latency, 3),
            'min_seconds': round(min_latency, 3),
            'target_met': avg_latency < 5.0
        },
        'users': {
            'total': total_users,
            'with_consent': users_with_consent,
            'consent_rate_percent': round(consent_rate, 1)
        },
        'recommendations': {
            'total_generated': total_recommendations,
            'total_views': total_views,
            'total_acceptances': total_acceptances,
            'acceptance_rate_percent': round((total_acceptances / total_views * 100) if total_views > 0 else 0, 1)
        },
        'api_calls': {
            'total': total_api_calls,
            'avg_per_minute': round((total_api_calls / max((datetime.now() - app_start_time).total_seconds(), 1)) * 60, 2)
        }
    })


@app.route('/operator/users', methods=['GET'])
def get_operator_users():
    """
    Get filtered list of users for operator view
    
    Query parameters:
    - persona: Filter by persona (e.g., "high_utilization")
    - signal_type: Filter by signal type (e.g., "subscriptions", "credit")
    - has_consent: Filter by consent status (true/false)
    """
    persona_filter = request.args.get('persona')
    signal_type_filter = request.args.get('signal_type')
    has_consent = request.args.get('has_consent')
    
    # Start with all users
    users_result = data['users'].copy()
    
    # Apply consent filter
    if has_consent:
        consent_bool = has_consent.lower() == 'true'
        users_result = users_result[users_result['consent'] == consent_bool]
    
    # Apply persona filter
    if persona_filter:
        from db.database import get_db_connection
        with get_db_connection() as conn:
            query = '''
                SELECT DISTINCT user_id FROM persona_assignments
                WHERE primary_persona = ?
            '''
            persona_users_df = pd.read_sql_query(query, conn, params=(persona_filter,))
            if not persona_users_df.empty:
                persona_users = persona_users_df['user_id'].tolist()
                users_result = users_result[users_result['user_id'].isin(persona_users)]
    
    # Apply signal type filter
    if signal_type_filter:
        from db.database import get_db_connection
        with get_db_connection() as conn:
            query = 'SELECT DISTINCT user_id FROM behavioral_signals WHERE signal_type = ?'
            signal_users_df = pd.read_sql_query(query, conn, params=(signal_type_filter,))
            if not signal_users_df.empty:
                signal_users = signal_users_df['user_id'].tolist()
                users_result = users_result[users_result['user_id'].isin(signal_users)]
    
    # Get persona and signals for each user
    result_users = []
    for _, user in users_result.iterrows():
        user_id = user['user_id']
        
        # Get persona from database
        persona_name = 'Unassigned'
        primary_persona = None
        latest_persona = PersonaAssignment.get_latest(user_id)
        if latest_persona:
            persona_name = latest_persona.get('persona_name', 'Unassigned')
            primary_persona = latest_persona.get('primary_persona')
        
        # Get signals summary from database
        signals_summary = {}
        latest_signals = BehavioralSignal.get_latest(user_id)
        if latest_signals:
            signals = latest_signals.get('signals', {})
            signals_summary = {
                'has_subscriptions': bool(signals.get('subscriptions')),
                'has_savings_signals': bool(signals.get('savings')),
                'has_credit_signals': bool(signals.get('credit')),
                'has_income_signals': bool(signals.get('income'))
            }
        
        result_users.append({
            'user_id': user_id,
            'name': user['name'],
            'email': user['email'],
            'consent': bool(user['consent']),
            'persona': persona_name,
            'primary_persona': primary_persona,
            'signals': signals_summary
        })
    
    return jsonify({
        'total_users': len(result_users),
        'filters_applied': {
            'persona': persona_filter,
            'signal_type': signal_type_filter,
            'has_consent': has_consent
        },
        'users': result_users
    })


@app.route('/operator/eval/export-pdf', methods=['GET'])
def export_evaluation_pdf():
    """
    Export evaluation report as PDF
    
    Returns PDF file download
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from io import BytesIO
        
        with get_db_connection() as conn:
            # Get data from database
            personas_df = pd.read_sql_query('SELECT * FROM persona_assignments', conn)
            
            if personas_df.empty:
                return jsonify({'error': 'No evaluation data available yet'}), 400
            
            signals_df = pd.read_sql_query('SELECT * FROM behavioral_signals', conn)
            if not signals_df.empty:
                signals_df = signals_df.groupby('user_id').size().reset_index(name='signal_count')
            else:
                signals_df = pd.DataFrame(columns=['user_id', 'signal_count'])
            
            # Get recommendations from database
            recommendations_list = []
            recs_df = pd.read_sql_query('SELECT * FROM recommendations', conn)
            for _, rec in recs_df.iterrows():
                recommendations_list.append({
                    'rationale': rec.get('rationale'),
                    'decision_trace': json.loads(rec.get('decision_trace') or '[]')
                })
        
        # Get users data
        users_df = get_users_df()
        
        # Generate report
        report = generate_evaluation_report(
            users_df=users_df,
            personas_df=personas_df,
            signals_df=signals_df,
            recommendations_list=recommendations_list,
            timings_list=timings_history
        )
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=30
        )
        story.append(Paragraph("SpendSense Evaluation Report", title_style))
        story.append(Paragraph(f"Generated: {report['timestamp']}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        summary_data = [
            ['Metric', 'Value', 'Target Met'],
            ['Coverage', f"{report['coverage']['coverage_percent']:.1f}%", '✓' if report['coverage']['target_met'] else '✗'],
            ['Explainability', f"{report['explainability']['explainability_percent']:.1f}%", '✓' if report['explainability']['target_met'] else '✗'],
            ['Avg Latency', f"{report['latency']['avg_latency']:.2f}s", '✓' if report['latency']['target_met'] else '✗'],
            ['Auditability', f"{report['auditability']['auditability_percent']:.1f}%", '✓' if report['auditability']['target_met'] else '✗'],
            ['Overall Score', f"{report['overall_score']:.1f}%", f"{report['targets_met']}"],
        ]
        summary_table = Table(summary_data, colWidths=[3*inch, 1.5*inch, 1*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Detailed metrics
        story.append(Paragraph("Detailed Metrics", styles['Heading2']))
        
        # Coverage details
        story.append(Paragraph("Coverage Metrics", styles['Heading3']))
        coverage_data = [
            ['Metric', 'Value'],
            ['Total Users', str(report['coverage']['total_users'])],
            ['Users with Persona', str(report['coverage']['users_with_persona'])],
            ['Users with ≥3 Behaviors', str(report['coverage']['users_with_3plus_behaviors'])],
            ['Fully Covered Users', str(report['coverage']['users_fully_covered'])],
            ['Coverage %', f"{report['coverage']['coverage_percent']:.1f}%"],
        ]
        coverage_table = Table(coverage_data, colWidths=[3*inch, 2*inch])
        coverage_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(coverage_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Latency details
        story.append(Paragraph("Latency Metrics", styles['Heading3']))
        latency_data = [
            ['Metric', 'Value'],
            ['Average Latency', f"{report['latency']['avg_latency']:.3f}s"],
            ['Max Latency', f"{report['latency']['max_latency']:.3f}s"],
            ['Min Latency', f"{report['latency']['min_latency']:.3f}s"],
        ]
        latency_table = Table(latency_data, colWidths=[3*inch, 2*inch])
        latency_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(latency_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        from flask import Response
        return Response(
            buffer.read(),
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=spendsense_evaluation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            }
        )
        
    except ImportError:
        return jsonify({'error': 'reportlab not installed. Run: pip install reportlab'}), 500
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500


# Register history and session routes
from app_history import register_history_routes, register_session_routes
register_history_routes(app)
register_session_routes(app)


if __name__ == '__main__':
    print("\n" + "="*60)
    print("SpendSense API is running!")
    print("="*60)
    print("\nAvailable endpoints:")
    print("  GET  /                          - Health check")
    print("  GET  /users                     - List all users")
    print("  GET  /profile/<user_id>         - Get user profile")
    print("  GET  /recommendations/<user_id> - Get recommendations")
    print("  POST /what-if                   - Run what-if simulation")
    print("  POST /what-if/export             - Export scenario report (PDF/JSON)")
    print("  POST /consent                   - Update consent")
    print("  GET  /eval/report               - Get evaluation metrics")
    print("  POST /eval/save                 - Save evaluation report")
    print("\nOperator Analytics:")
    print("  GET  /operator/persona-distribution      - Persona distribution chart")
    print("  GET  /operator/recommendation-tracking   - Recommendation acceptance stats")
    print("  POST /operator/recommendation/accept     - Track recommendation acceptance")
    print("  GET  /operator/system-health             - System health metrics")
    print("  GET  /operator/users                     - Filtered user list")
    print("  GET  /operator/eval/export-pdf           - Export evaluation as PDF")
    print("\nHistory & Trends:")
    print("  GET  /history/recommendations/<user_id> - Recommendation history")
    print("  GET  /history/persona/<user_id>          - Persona assignment history")
    print("  GET  /history/acceptance-rate            - Acceptance rate trends")
    print("  GET  /history/persona-distribution       - Persona distribution trends")
    print("  GET  /history/user-activity/<user_id>    - User activity history")
    print("\nSession Management:")
    print("  POST /session/create            - Create user session")
    print("  POST /session/validate         - Validate session token")
    print("  POST /session/deactivate       - Deactivate session")
    print("  GET  /session/user/<user_id>   - Get user sessions")
    print("\n" + "="*60 + "\n")

    app.run(debug=True, port=5000)
