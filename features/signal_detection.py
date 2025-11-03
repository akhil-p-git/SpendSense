"""
Behavioral signal detection for SpendSense
Computes subscription, savings, credit, and income patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter


def detect_subscriptions(transactions_df, window_days=90):
    """
    Detect recurring subscription patterns

    Returns: dict with recurring_merchants, monthly_recurring_spend, subscription_share
    """
    # Ensure dates are datetime objects
    if not pd.api.types.is_datetime64_any_dtype(transactions_df['date']):
        transactions_df = transactions_df.copy()
        transactions_df['date'] = pd.to_datetime(transactions_df['date'])

    # Filter to window
    end_date = transactions_df['date'].max()
    start_date = end_date - timedelta(days=window_days)
    window_txns = transactions_df[
        (transactions_df['date'] >= start_date) &
        (transactions_df['amount'] > 0)  # Only expenses
    ].copy()

    # Group by merchant and count occurrences
    merchant_counts = window_txns.groupby('merchant_name').agg({
        'transaction_id': 'count',
        'amount': ['mean', 'sum']
    }).reset_index()

    merchant_counts.columns = ['merchant_name', 'count', 'avg_amount', 'total_amount']

    # Recurring merchants: ≥3 transactions with similar amounts (±20%)
    recurring_merchants = []
    for _, merchant in merchant_counts.iterrows():
        if merchant['count'] >= 3:
            merchant_txns = window_txns[window_txns['merchant_name'] == merchant['merchant_name']]
            amounts = merchant_txns['amount'].values
            cv = amounts.std() / amounts.mean() if amounts.mean() > 0 else 1

            # If coefficient of variation < 0.2, it's likely a subscription
            if cv < 0.2:
                recurring_merchants.append(merchant['merchant_name'])

    # Calculate monthly recurring spend
    recurring_spend = window_txns[
        window_txns['merchant_name'].isin(recurring_merchants)
    ]['amount'].sum()

    monthly_recurring_spend = recurring_spend / (window_days / 30)

    # Calculate subscription share
    total_spend = window_txns['amount'].sum()
    subscription_share = (recurring_spend / total_spend * 100) if total_spend > 0 else 0

    return {
        'recurring_merchants': recurring_merchants,
        'num_recurring_merchants': len(recurring_merchants),
        'monthly_recurring_spend': monthly_recurring_spend,
        'subscription_share': subscription_share
    }


def detect_savings_behavior(transactions_df, accounts_df, window_days=180):
    """
    Detect savings patterns and emergency fund coverage

    Returns: dict with net_savings_inflow, growth_rate, emergency_fund_coverage
    """
    # Ensure dates are datetime objects
    if not pd.api.types.is_datetime64_any_dtype(transactions_df['date']):
        transactions_df = transactions_df.copy()
        transactions_df['date'] = pd.to_datetime(transactions_df['date'])

    # Get savings-type accounts
    savings_accounts = accounts_df[
        accounts_df['type'].isin(['savings', 'money market', 'hsa'])
    ]['account_id'].tolist()

    if not savings_accounts:
        return {
            'net_savings_inflow': 0,
            'savings_growth_rate': 0,
            'emergency_fund_coverage': 0,
            'monthly_savings_inflow': 0
        }

    # Filter transactions to savings accounts and window
    end_date = transactions_df['date'].max()
    start_date = end_date - timedelta(days=window_days)

    savings_txns = transactions_df[
        (transactions_df['account_id'].isin(savings_accounts)) &
        (transactions_df['date'] >= start_date)
    ]

    # Net inflow (negative amounts = deposits)
    net_inflow = -savings_txns['amount'].sum()
    monthly_inflow = net_inflow / (window_days / 30)

    # Growth rate
    current_savings_balance = accounts_df[
        accounts_df['account_id'].isin(savings_accounts)
    ]['balance_current'].sum()

    initial_balance = current_savings_balance - net_inflow
    growth_rate = ((current_savings_balance / initial_balance) - 1) * 100 if initial_balance > 0 else 0

    # Emergency fund coverage
    # Calculate average monthly expenses
    checking_accounts = accounts_df[accounts_df['type'] == 'checking']['account_id'].tolist()
    expense_txns = transactions_df[
        (transactions_df['account_id'].isin(checking_accounts)) &
        (transactions_df['amount'] > 0) &  # Positive = expense
        (transactions_df['date'] >= end_date - timedelta(days=90))
    ]

    avg_monthly_expenses = expense_txns['amount'].sum() / 3  # 90 days = 3 months
    emergency_fund_coverage = current_savings_balance / avg_monthly_expenses if avg_monthly_expenses > 0 else 0

    return {
        'net_savings_inflow': net_inflow,
        'savings_growth_rate': growth_rate,
        'emergency_fund_coverage': emergency_fund_coverage,
        'monthly_savings_inflow': monthly_inflow,
        'current_savings_balance': current_savings_balance
    }


def detect_credit_behavior(accounts_df, liabilities_df):
    """
    Detect credit utilization and payment patterns

    Returns: dict with utilization metrics, payment behavior flags
    """
    credit_accounts = accounts_df[accounts_df['type'] == 'credit card']

    if credit_accounts.empty:
        return {
            'has_credit_card': False,
            'max_utilization': 0,
            'avg_utilization': 0,
            'high_utilization_flag': False,
            'minimum_payment_only': False,
            'has_interest_charges': False,
            'is_overdue': False
        }

    # Calculate utilizations
    utilizations = []
    for _, account in credit_accounts.iterrows():
        if account['balance_limit'] and account['balance_limit'] > 0:
            util = (account['balance_current'] / account['balance_limit']) * 100
            utilizations.append(util)

    max_utilization = max(utilizations) if utilizations else 0
    avg_utilization = np.mean(utilizations) if utilizations else 0

    # Check for minimum payment only
    minimum_payment_only = False
    has_interest_charges = False
    is_overdue = False

    if not liabilities_df.empty:
        for _, liability in liabilities_df.iterrows():
            # If last payment ≈ minimum payment, flag it
            # Check if columns exist before accessing
            if pd.notna(liability.get('last_payment_amount')) and pd.notna(liability.get('minimum_payment')):
                if liability['last_payment_amount'] <= liability['minimum_payment'] * 1.1:
                    minimum_payment_only = True

            # Interest charges present if APR > 0 and balance > 0
            account = credit_accounts[credit_accounts['account_id'] == liability['account_id']]
            if not account.empty and account.iloc[0]['balance_current'] > 0:
                has_interest_charges = True

            # Check overdue status if column exists
            if 'is_overdue' in liability.index and liability['is_overdue']:
                is_overdue = True

    return {
        'has_credit_card': True,
        'max_utilization': max_utilization,
        'avg_utilization': avg_utilization,
        'num_credit_cards': len(credit_accounts),
        'high_utilization_flag': max_utilization >= 50,
        'medium_utilization_flag': max_utilization >= 30,
        'minimum_payment_only': minimum_payment_only,
        'has_interest_charges': has_interest_charges,
        'is_overdue': is_overdue,
        'total_credit_balance': credit_accounts['balance_current'].sum(),
        'total_credit_limit': credit_accounts['balance_limit'].sum()
    }


def detect_income_stability(transactions_df, accounts_df, window_days=180):
    """
    Detect income patterns and cash flow stability

    Returns: dict with payroll frequency, variability, cash flow buffer
    """
    # Ensure dates are datetime objects
    if not pd.api.types.is_datetime64_any_dtype(transactions_df['date']):
        transactions_df = transactions_df.copy()
        transactions_df['date'] = pd.to_datetime(transactions_df['date'])

    # Get checking accounts
    checking_accounts = accounts_df[accounts_df['type'] == 'checking']['account_id'].tolist()

    if not checking_accounts:
        return {
            'has_payroll': False,
            'median_pay_gap': 0,
            'pay_variability': 0,
            'cash_flow_buffer': 0
        }

    # Filter to window
    end_date = transactions_df['date'].max()
    start_date = end_date - timedelta(days=window_days)

    # Find payroll transactions (income)
    income_txns = transactions_df[
        (transactions_df['account_id'].isin(checking_accounts)) &
        (transactions_df['category_primary'] == 'INCOME') &
        (transactions_df['amount'] < 0) &  # Negative = income
        (transactions_df['date'] >= start_date)
    ].sort_values('date')

    if len(income_txns) < 2:
        return {
            'has_payroll': False,
            'median_pay_gap': 0,
            'pay_variability': 0,
            'cash_flow_buffer': 0
        }

    # Calculate pay gaps
    pay_dates = income_txns['date'].tolist()
    pay_gaps = [(pay_dates[i+1] - pay_dates[i]).days for i in range(len(pay_dates)-1)]

    median_pay_gap = np.median(pay_gaps) if pay_gaps else 0
    pay_variability = np.std(pay_gaps) if len(pay_gaps) > 1 else 0

    # Cash flow buffer = checking balance / avg monthly expenses
    checking_balance = accounts_df[
        accounts_df['account_id'].isin(checking_accounts)
    ]['balance_current'].sum()

    expense_txns = transactions_df[
        (transactions_df['account_id'].isin(checking_accounts)) &
        (transactions_df['amount'] > 0) &
        (transactions_df['date'] >= end_date - timedelta(days=90))
    ]

    avg_monthly_expenses = expense_txns['amount'].sum() / 3
    cash_flow_buffer = checking_balance / avg_monthly_expenses if avg_monthly_expenses > 0 else 0

    return {
        'has_payroll': True,
        'median_pay_gap': median_pay_gap,
        'pay_variability': pay_variability,
        'cash_flow_buffer': cash_flow_buffer,
        'avg_income_amount': -income_txns['amount'].mean()
    }


def detect_behavioral_signals(user_id, transactions_df, accounts_df, liabilities_df, window_days=180):
    """
    Detect all behavioral signals for a user

    Args:
        user_id: User ID
        transactions_df: All transactions
        accounts_df: All accounts
        liabilities_df: All liabilities
        window_days: Time window in days (default 180)

    Returns:
        Dictionary with all detected signals
    """
    # Filter to user's data
    user_accounts = accounts_df[accounts_df['user_id'] == user_id]
    user_account_ids = user_accounts['account_id'].tolist()
    user_transactions = transactions_df[transactions_df['account_id'].isin(user_account_ids)]
    user_liabilities = liabilities_df[liabilities_df['account_id'].isin(user_account_ids)] if not liabilities_df.empty else pd.DataFrame()

    # Detect all signals
    subscription_signals = detect_subscriptions(user_transactions, window_days=90)
    savings_signals = detect_savings_behavior(user_transactions, user_accounts, window_days)
    credit_signals = detect_credit_behavior(user_accounts, user_liabilities)
    income_signals = detect_income_stability(user_transactions, user_accounts, window_days)

    return {
        'user_id': user_id,
        'window_days': window_days,
        'subscriptions': subscription_signals,
        'savings': savings_signals,
        'credit': credit_signals,
        'income': income_signals,
        'timestamp': datetime.now().isoformat()
    }


if __name__ == '__main__':
    # Test with sample data
    from ingest.data_generator import generate_synthetic_data

    data = generate_synthetic_data(num_users=10)

    user_id = data['users']['user_id'].iloc[0]
    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    print(f"\nBehavioral signals for {user_id}:")
    print(json.dumps(signals, indent=2, default=str))
