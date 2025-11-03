"""
SpendSense Main Application
Flask API for personalized financial recommendations
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json

from ingest.data_generator import generate_synthetic_data
from features.signal_detection import detect_behavioral_signals
from personas.persona_assignment import assign_persona, get_persona_rationale
from recommend.recommendation_engine import generate_recommendations
from recommend.what_if_simulator import WhatIfSimulator

app = Flask(__name__)
CORS(app)

# Load or generate data
print("Initializing SpendSense...")
data = generate_synthetic_data(num_users=75)
print("✓ Data loaded")


@app.route('/')
def home():
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

    # Check consent
    if not user.iloc[0]['consent']:
        return jsonify({'error': 'User has not provided consent'}), 403

    # Detect behavioral signals
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

    # Check consent
    if not user.iloc[0]['consent']:
        return jsonify({'error': 'User has not provided consent'}), 403

    # Get signals and persona
    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    persona = assign_persona(signals)

    # Generate recommendations
    recommendations = generate_recommendations(
        user_id,
        persona,
        signals,
        data['accounts']
    )

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
            result = simulator.simulate_extra_credit_payment(
                params['account_id'],
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
    req_data = request.get_json()
    user_id = req_data.get('user_id')
    consent = req_data.get('consent')

    # Update consent in data
    data['users'].loc[data['users']['user_id'] == user_id, 'consent'] = consent

    return jsonify({
        'user_id': user_id,
        'consent': consent,
        'message': 'Consent updated successfully'
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
    print("\n" + "="*60 + "\n")

    app.run(debug=True, port=5000)
