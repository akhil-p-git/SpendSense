"""
Synthetic Plaid-style data generator for SpendSense
Generates accounts, transactions, and liabilities data for 50-100 users
"""

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import json
import random

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

# Plaid category mappings
CATEGORIES = {
    'FOOD_AND_DRINK': ['Restaurants', 'Groceries', 'Coffee Shops'],
    'GENERAL_MERCHANDISE': ['Retail', 'Online Shopping', 'Department Stores'],
    'TRANSPORTATION': ['Gas Stations', 'Public Transit', 'Ride Share'],
    'ENTERTAINMENT': ['Streaming Services', 'Movies', 'Concerts'],
    'BILLS_AND_UTILITIES': ['Electric', 'Internet', 'Phone', 'Water'],
    'TRANSFER': ['Transfer', 'Payroll', 'Deposit'],
    'INCOME': ['Payroll', 'Direct Deposit'],
}

SUBSCRIPTION_MERCHANTS = [
    'Netflix', 'Spotify', 'Amazon Prime', 'Hulu', 'Disney+',
    'YouTube Premium', 'Apple Music', 'HBO Max', 'Gym Membership',
    'Adobe Creative Cloud', 'Microsoft 365'
]


def generate_users(num_users=75):
    """Generate synthetic user profiles"""
    users = []
    for i in range(num_users):
        user = {
            'user_id': f'user_{i:04d}',
            'name': fake.name(),
            'email': fake.email(),
            'income_level': random.choice(['low', 'medium', 'high']),
            'created_at': fake.date_time_between(start_date='-2y', end_date='now'),
            'consent': random.choice([True, True, True, False])  # 75% consent rate
        }
        users.append(user)
    return pd.DataFrame(users)


def generate_accounts(users_df):
    """Generate bank accounts for each user"""
    accounts = []

    for _, user in users_df.iterrows():
        num_accounts = random.randint(2, 5)

        # Most users have checking and savings
        account_types = ['checking', 'savings']

        # Some have credit cards
        if random.random() > 0.3:
            account_types.append('credit card')

        # Fewer have money market or HSA
        if random.random() > 0.7:
            account_types.append(random.choice(['money market', 'hsa']))

        for i, acc_type in enumerate(account_types[:num_accounts]):
            account_id = f"{user['user_id']}_acc_{i:02d}"

            if acc_type == 'checking':
                balance = random.uniform(500, 10000)
                limit = None
            elif acc_type == 'savings':
                balance = random.uniform(0, 50000)
                limit = None
            elif acc_type == 'credit card':
                limit = random.choice([2000, 5000, 10000, 15000, 25000])
                balance = random.uniform(0, limit * 0.9)  # 0-90% utilization
            elif acc_type == 'money market':
                balance = random.uniform(5000, 100000)
                limit = None
            else:  # HSA
                balance = random.uniform(0, 10000)
                limit = None

            accounts.append({
                'account_id': account_id,
                'user_id': user['user_id'],
                'type': acc_type,
                'subtype': acc_type,
                'balance_current': balance,
                'balance_available': balance if acc_type != 'credit card' else (limit - balance if limit else None),
                'balance_limit': limit,
                'iso_currency_code': 'USD',
                'holder_category': 'personal'
            })

    return pd.DataFrame(accounts)


def generate_transactions(accounts_df, num_days=180):
    """Generate transaction history for accounts"""
    transactions = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=num_days)

    for _, account in accounts_df.iterrows():
        account_id = account['account_id']
        account_type = account['type']

        # Different transaction frequencies based on account type
        if account_type == 'checking':
            num_transactions = random.randint(100, 300)
        elif account_type == 'credit card':
            num_transactions = random.randint(50, 200)
        elif account_type == 'savings':
            num_transactions = random.randint(5, 20)
        else:
            num_transactions = random.randint(2, 10)

        # Generate payroll for checking accounts
        if account_type == 'checking':
            # Add payroll transactions
            pay_frequency = random.choice([14, 15, 30, 31])  # bi-weekly or monthly
            current_date = start_date
            while current_date < end_date:
                pay_amount = random.uniform(2000, 8000)
                transactions.append({
                    'transaction_id': f"txn_{len(transactions):08d}",
                    'account_id': account_id,
                    'date': current_date.date(),
                    'amount': -pay_amount,  # Negative = income
                    'merchant_name': random.choice(['ADP Payroll', 'Direct Deposit', 'Salary Payment']),
                    'payment_channel': 'other',
                    'category_primary': 'INCOME',
                    'category_detailed': 'Payroll',
                    'pending': False
                })
                current_date += timedelta(days=pay_frequency + random.randint(-2, 2))

        # Add subscriptions for credit cards and checking
        if account_type in ['checking', 'credit card']:
            num_subscriptions = random.randint(1, 5)
            for sub_merchant in random.sample(SUBSCRIPTION_MERCHANTS, num_subscriptions):
                sub_amount = random.uniform(5, 50)
                current_date = start_date
                while current_date < end_date:
                    transactions.append({
                        'transaction_id': f"txn_{len(transactions):08d}",
                        'account_id': account_id,
                        'date': current_date.date(),
                        'amount': sub_amount,
                        'merchant_name': sub_merchant,
                        'payment_channel': 'online',
                        'category_primary': 'ENTERTAINMENT',
                        'category_detailed': 'Streaming Services',
                        'pending': False
                    })
                    current_date += timedelta(days=30 + random.randint(-2, 2))

        # Generate regular transactions
        for _ in range(num_transactions):
            transaction_date = fake.date_time_between(
                start_date=start_date,
                end_date=end_date
            )

            category_primary = random.choice(list(CATEGORIES.keys()))
            category_detailed = random.choice(CATEGORIES[category_primary])

            # Amount varies by category
            if category_primary == 'INCOME':
                amount = -random.uniform(1000, 5000)
            elif category_primary == 'BILLS_AND_UTILITIES':
                amount = random.uniform(50, 300)
            elif category_primary == 'FOOD_AND_DRINK':
                amount = random.uniform(5, 150)
            elif category_primary == 'GENERAL_MERCHANDISE':
                amount = random.uniform(20, 500)
            else:
                amount = random.uniform(10, 200)

            transactions.append({
                'transaction_id': f"txn_{len(transactions):08d}",
                'account_id': account_id,
                'date': transaction_date.date(),
                'amount': amount,
                'merchant_name': fake.company(),
                'payment_channel': random.choice(['online', 'in store', 'other']),
                'category_primary': category_primary,
                'category_detailed': category_detailed,
                'pending': random.choice([True, False]) if transaction_date > end_date - timedelta(days=3) else False
            })

    return pd.DataFrame(transactions).sort_values('date')


def generate_liabilities(accounts_df):
    """Generate liability information for credit cards and loans"""
    liabilities = []

    for _, account in accounts_df.iterrows():
        if account['type'] == 'credit card':
            balance = account['balance_current']
            limit = account['balance_limit']
            utilization = balance / limit if limit else 0

            # Higher utilization = more likely to pay minimum only
            minimum_payment = max(25, balance * 0.02)

            if utilization > 0.7:
                last_payment = minimum_payment * random.uniform(0.8, 1.2)
            elif utilization > 0.4:
                last_payment = minimum_payment * random.uniform(1.5, 3.0)
            else:
                last_payment = balance * random.uniform(0.3, 1.0)

            liabilities.append({
                'account_id': account['account_id'],
                'user_id': account['user_id'],
                'type': 'credit',
                'apr_percentage': random.uniform(15.99, 29.99),
                'apr_type': 'variable',
                'minimum_payment_amount': minimum_payment,
                'last_payment_amount': last_payment,
                'last_statement_balance': balance * random.uniform(0.8, 1.1),
                'is_overdue': utilization > 0.8 and random.random() > 0.7,
                'next_payment_due_date': (datetime.now() + timedelta(days=random.randint(1, 30))).date()
            })

    return pd.DataFrame(liabilities) if liabilities else pd.DataFrame()


def generate_synthetic_data(num_users=75, output_dir='data', save_to_db=True):
    """
    Generate complete synthetic dataset

    Args:
        num_users: Number of users to generate (50-100)
        output_dir: Directory to save output files
        save_to_db: If True, save to SQLite database instead of CSV

    Returns:
        Dictionary containing all dataframes
    """
    print(f"Generating synthetic data for {num_users} users...")

    # Generate data
    users_df = generate_users(num_users)
    print(f"✓ Generated {len(users_df)} users")

    accounts_df = generate_accounts(users_df)
    print(f"✓ Generated {len(accounts_df)} accounts")

    transactions_df = generate_transactions(accounts_df)
    print(f"✓ Generated {len(transactions_df)} transactions")

    liabilities_df = generate_liabilities(accounts_df)
    print(f"✓ Generated {len(liabilities_df)} liabilities")

    # Save to database or CSV
    import os
    os.makedirs(output_dir, exist_ok=True)

    if save_to_db:
        try:
            from db.loader import load_data_to_db
            load_data_to_db({
                'users': users_df,
                'accounts': accounts_df,
                'transactions': transactions_df,
                'liabilities': liabilities_df
            })
            print(f"\n✓ Data saved to SQLite database")
        except ImportError:
            print("Warning: Database module not available, saving to CSV instead")
            save_to_db = False

    if not save_to_db:
        users_df.to_csv(f'{output_dir}/users.csv', index=False)
        accounts_df.to_csv(f'{output_dir}/accounts.csv', index=False)
        transactions_df.to_csv(f'{output_dir}/transactions.csv', index=False)
        liabilities_df.to_csv(f'{output_dir}/liabilities.csv', index=False)
        print(f"\n✓ Data saved to {output_dir}/ directory")

    return {
        'users': users_df,
        'accounts': accounts_df,
        'transactions': transactions_df,
        'liabilities': liabilities_df
    }


if __name__ == '__main__':
    data = generate_synthetic_data()
    print("\nData generation complete!")
