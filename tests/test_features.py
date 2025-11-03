"""
Tests for feature detection module
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from features.signal_detection import (
    detect_subscriptions,
    detect_savings_behavior,
    detect_credit_behavior,
    detect_income_stability,
    detect_behavioral_signals
)


@pytest.fixture
def sample_transactions():
    """Create sample transaction data"""
    return pd.DataFrame({
        'transaction_id': ['txn_001', 'txn_002', 'txn_003'],
        'account_id': ['acc_001', 'acc_001', 'acc_001'],
        'date': [datetime.now() - timedelta(days=i) for i in range(3)],
        'amount': [15.99, 15.99, 15.99],
        'merchant_name': ['Netflix', 'Netflix', 'Netflix'],
        'category_primary': ['ENTERTAINMENT'] * 3,
        'category_detailed': ['Streaming'] * 3
    })


@pytest.fixture
def sample_accounts():
    """Create sample account data"""
    return pd.DataFrame({
        'account_id': ['acc_001', 'acc_002'],
        'user_id': ['user_001', 'user_001'],
        'type': ['checking', 'credit card'],
        'balance_current': [5000.0, 1500.0],
        'balance_limit': [None, 5000.0]
    })


def test_detect_subscriptions(sample_transactions):
    """Test subscription detection"""
    result = detect_subscriptions(sample_transactions, window_days=90)
    
    assert 'recurring_merchants' in result
    assert 'num_recurring_merchants' in result
    assert 'monthly_recurring_spend' in result
    assert result['num_recurring_merchants'] >= 0


def test_detect_credit_behavior(sample_accounts):
    """Test credit behavior detection"""
    liabilities = pd.DataFrame({
        'account_id': ['acc_002'],
        'apr_percentage': [24.99],
        'minimum_payment_amount': [50.0],
        'last_payment_amount': [50.0],
        'is_overdue': [False]
    })
    
    result = detect_credit_behavior(sample_accounts, liabilities)
    
    assert 'has_credit_card' in result
    assert 'max_utilization' in result
    assert result['has_credit_card'] == True


def test_detect_savings_behavior(sample_transactions, sample_accounts):
    """Test savings behavior detection"""
    result = detect_savings_behavior(sample_transactions, sample_accounts)
    
    assert 'net_savings_inflow' in result
    assert 'savings_growth_rate' in result
    assert 'emergency_fund_coverage' in result


def test_detect_income_stability(sample_transactions, sample_accounts):
    """Test income stability detection"""
    # Add income transactions
    income_txns = pd.DataFrame({
        'transaction_id': ['txn_inc1', 'txn_inc2'],
        'account_id': ['acc_001', 'acc_001'],
        'date': [datetime.now() - timedelta(days=30), datetime.now() - timedelta(days=15)],
        'amount': [-5000.0, -5000.0],  # Negative = income
        'merchant_name': ['Payroll', 'Payroll'],
        'category_primary': ['INCOME', 'INCOME'],
        'category_detailed': ['Payroll', 'Payroll']
    })
    
    combined_txns = pd.concat([sample_transactions, income_txns])
    result = detect_income_stability(combined_txns, sample_accounts)
    
    assert 'has_payroll' in result
    assert 'median_pay_gap' in result
    assert 'cash_flow_buffer' in result


def test_detect_behavioral_signals(sample_transactions, sample_accounts):
    """Test full behavioral signal detection"""
    liabilities = pd.DataFrame()
    signals = detect_behavioral_signals(
        'user_001',
        sample_transactions,
        sample_accounts,
        liabilities
    )
    
    assert 'user_id' in signals
    assert 'subscriptions' in signals
    assert 'savings' in signals
    assert 'credit' in signals
    assert 'income' in signals
    assert signals['user_id'] == 'user_001'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

