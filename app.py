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
from guardrails.consent import check_consent, validate_consent_for_processing
from eval.metrics import (
    calculate_coverage,
    calculate_explainability,
    calculate_latency,
    calculate_auditability,
    generate_evaluation_report,
    save_evaluation_report
)

app = Flask(__name__, static_folder='ui', static_url_path='')
CORS(app)

# Load or generate data
print("Initializing SpendSense...")
data = generate_synthetic_data(num_users=75)
print("✓ Data loaded")

# Evaluation tracking
recommendations_history = []
timings_history = []
personas_history = []
signals_history = []


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
    users = data['users'][['user_id', 'name', 'email', 'consent']].to_dict('records')
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
    user = data['users'][data['users']['user_id'] == user_id]
    if user.empty:
        return jsonify({'error': 'User not found'}), 404

    # Check consent using guardrails
    is_valid, error_msg = validate_consent_for_processing(user_id, data['users'])
    if not is_valid:
        return jsonify({'error': error_msg}), 403

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

    # Track for evaluation
    latency = time.time() - start_time
    timings_history.append({
        'user_id': user_id,
        'endpoint': 'profile',
        'latency_seconds': latency,
        'timestamp': datetime.now().isoformat()
    })
    
    if persona.get('primary_persona'):
        personas_history.append({
            'user_id': user_id,
            'primary_persona': persona['primary_persona'],
            'persona_name': persona['persona_name'],
            'timestamp': datetime.now().isoformat()
        })
        signals_history.append({
            'user_id': user_id,
            'signals': signals,
            'timestamp': datetime.now().isoformat()
        })

    return jsonify({
        'user_id': user_id,
        'name': user.iloc[0]['name'],
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
    user = data['users'][data['users']['user_id'] == user_id]
    if user.empty:
        return jsonify({'error': 'User not found'}), 404

    # Check consent using guardrails
    is_valid, error_msg = validate_consent_for_processing(user_id, data['users'])
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Track timing for evaluation
    start_time = time.time()

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

    # Flatten recommendations for tracking
    all_recs = recommendations.get('education', []) + recommendations.get('offers', [])
    recommendations_history.extend(all_recs)

    return jsonify(recommendations)


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
    user = data['users'][data['users']['user_id'] == user_id]
    if user.empty:
        return jsonify({'error': 'User not found'}), 404

    if not user.iloc[0]['consent']:
        return jsonify({'error': 'User has not provided consent'}), 403

    # Get user data
    user_accounts = data['accounts'][data['accounts']['user_id'] == user_id]
    user_liabilities = data['liabilities'][
        data['liabilities']['account_id'].isin(user_accounts['account_id'])
    ]

    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    # Initialize simulator
    simulator = WhatIfSimulator(signals, user_accounts, user_liabilities)

    # Run appropriate simulation
    try:
        if scenario_type == 'extra_credit_payment':
            account_id = params.get('account_id')
            if not account_id:
                # Try to find a credit card account automatically
                credit_cards = user_accounts[user_accounts['type'] == 'credit card']
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
                params.get('scenarios', [])
            )

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

    # Update consent using guardrails module
    success = update_consent_status(user_id, consent, data['users'])

    if not success:
        return jsonify({'error': 'User not found'}), 404

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
    user = data['users'][data['users']['user_id'] == user_id]
    if user.empty:
        return jsonify({'error': 'User not found'}), 404

    # Check consent
    is_valid, error_msg = validate_consent_for_processing(user_id, data['users'])
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Get user's accounts
    user_accounts = data['accounts'][data['accounts']['user_id'] == user_id]
    
    # Format for frontend
    accounts = []
    for _, acc in user_accounts.iterrows():
        accounts.append({
            'account_id': acc['account_id'],
            'type': acc['type'],
            'subtype': acc.get('subtype', acc['type']),
            'balance_current': float(acc['balance_current']),
            'balance_available': float(acc['balance_available']) if pd.notna(acc.get('balance_available')) else None,
            'balance_limit': float(acc['balance_limit']) if pd.notna(acc.get('balance_limit')) else None,
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
    user = data['users'][data['users']['user_id'] == user_id]
    if user.empty:
        return jsonify({'error': 'User not found'}), 404

    # Check consent
    is_valid, error_msg = validate_consent_for_processing(user_id, data['users'])
    if not is_valid:
        return jsonify({'error': error_msg}), 403

    # Get user's accounts
    user_accounts = data['accounts'][data['accounts']['user_id'] == user_id]
    user_account_ids = user_accounts['account_id'].tolist()
    
    # Get recent transactions
    user_transactions = data['transactions'][
        data['transactions']['account_id'].isin(user_account_ids)
    ].sort_values('date', ascending=False).head(30)
    
    # Format for frontend
    transactions = []
    for _, txn in user_transactions.iterrows():
        transactions.append({
            'transaction_id': txn['transaction_id'],
            'date': txn['date'].isoformat() if hasattr(txn['date'], 'isoformat') else str(txn['date']),
            'merchant_name': txn['merchant_name'],
            'amount': float(txn['amount']),
            'category_primary': txn['category_primary'],
            'category_detailed': txn['category_detailed'],
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

    if not personas_history:
        return jsonify({
            'error': 'No evaluation data available yet'
        }), 400

    personas_df = pd.DataFrame(personas_history)
    
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

    report = generate_evaluation_report(
        users_df=data['users'],
        personas_df=personas_df,
        signals_df=signals_df,
        recommendations_list=recommendations_history,
        timings_list=timings_history
    )

    save_evaluation_report(report, output_path)

    return jsonify({
        'message': 'Evaluation report saved',
        'path': output_path,
        'report': report
    })


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
    print("  POST /consent                   - Update consent")
    print("  GET  /eval/report               - Get evaluation metrics")
    print("  POST /eval/save                 - Save evaluation report")
    print("\n" + "="*60 + "\n")

    app.run(debug=True, port=5000)
