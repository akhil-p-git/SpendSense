"""
Tests for What-If simulator module
"""

import pytest
import pandas as pd
from recommend.what_if_simulator import WhatIfSimulator


@pytest.fixture
def sample_signals():
    """Create sample signals"""
    return {
        'subscriptions': {
            'monthly_recurring_spend': 100.0
        },
        'savings': {
            'current_savings_balance': 5000.0,
            'monthly_savings_inflow': 200.0,
            'emergency_fund_coverage': 2.5
        }
    }


@pytest.fixture
def sample_accounts():
    """Create sample accounts"""
    return pd.DataFrame({
        'account_id': ['card_001'],
        'type': ['credit card'],
        'balance_current': [3000.0],
        'balance_limit': [5000.0]
    })


@pytest.fixture
def sample_liabilities():
    """Create sample liabilities"""
    return pd.DataFrame({
        'account_id': ['card_001'],
        'apr_percentage': [24.99],
        'minimum_payment_amount': [100.0],
        'last_payment_amount': [100.0],
        'is_overdue': [False]
    })


@pytest.fixture
def simulator(sample_signals, sample_accounts, sample_liabilities):
    """Create WhatIfSimulator instance"""
    return WhatIfSimulator(sample_signals, sample_accounts, sample_liabilities)


def test_simulate_extra_credit_payment(simulator):
    """Test extra credit payment simulation"""
    result = simulator.simulate_extra_credit_payment(
        'card_001',
        extra_monthly_payment=200,
        months=12
    )
    
    assert result['scenario_type'] == 'extra_credit_payment'
    assert 'current_scenario' in result
    assert 'extra_payment_scenario' in result
    assert 'savings' in result
    assert result['savings']['interest_saved'] >= 0


def test_simulate_subscription_cancellation(simulator):
    """Test subscription cancellation simulation"""
    subscriptions = [
        {'name': 'Netflix', 'amount': 15.99},
        {'name': 'Spotify', 'amount': 9.99}
    ]
    
    result = simulator.simulate_subscription_cancellation(subscriptions)
    
    assert result['scenario_type'] == 'subscription_cancellation'
    assert 'monthly_savings' in result
    assert 'annual_savings' in result
    assert result['monthly_savings'] == 25.98


def test_simulate_increased_savings(simulator):
    """Test increased savings simulation"""
    result = simulator.simulate_increased_savings(
        monthly_amount=500,
        target_amount=10000,
        months=12
    )
    
    assert result['scenario_type'] == 'increased_savings'
    assert 'current_state' in result
    assert 'projected_state' in result
    assert 'growth' in result
    assert result['projected_state']['final_balance'] > result['current_state']['savings_balance']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

