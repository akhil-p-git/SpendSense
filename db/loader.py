"""
Database loader - migrate data from DataFrames to SQLite
"""

import pandas as pd
from datetime import datetime
from .database import get_db_connection
from .models import (
    User, Account, Transaction, Liability,
    PersonaAssignment, BehavioralSignal, Recommendation
)


def load_data_to_db(data_dict: dict):
    """
    Load data from dictionary of DataFrames into SQLite database
    
    Args:
        data_dict: Dictionary with keys 'users', 'accounts', 'transactions', 'liabilities'
    """
    print("Loading data into database...")
    
    # Load users
    if 'users' in data_dict:
        users_df = data_dict['users']
        print(f"Loading {len(users_df)} users...")
        for _, user in users_df.iterrows():
            User.save(
                user_id=user['user_id'],
                name=user['name'],
                email=user['email'],
                income_level=user.get('income_level'),
                consent=bool(user.get('consent', False))
            )
        print("✓ Users loaded")
    
    # Load accounts
    if 'accounts' in data_dict:
        accounts_df = data_dict['accounts']
        print(f"Loading {len(accounts_df)} accounts...")
        for _, account in accounts_df.iterrows():
            Account.save(
                account_id=account['account_id'],
                user_id=account['user_id'],
                account_type=account['type'],
                subtype=account.get('subtype'),
                balance_current=float(account['balance_current']),
                balance_available=float(account['balance_available']) if pd.notna(account.get('balance_available')) else None,
                balance_limit=float(account['balance_limit']) if pd.notna(account.get('balance_limit')) else None,
                iso_currency_code=account.get('iso_currency_code', 'USD'),
                holder_category=account.get('holder_category')
            )
        print("✓ Accounts loaded")
    
    # Load transactions
    if 'transactions' in data_dict:
        transactions_df = data_dict['transactions']
        print(f"Loading {len(transactions_df)} transactions...")
        for _, txn in transactions_df.iterrows():
            Transaction.save(
                transaction_id=txn['transaction_id'],
                account_id=txn['account_id'],
                date=txn['date'],
                amount=float(txn['amount']),
                merchant_name=txn.get('merchant_name'),
                payment_channel=txn.get('payment_channel'),
                category_primary=txn.get('category_primary'),
                category_detailed=txn.get('category_detailed'),
                pending=bool(txn.get('pending', False))
            )
        print("✓ Transactions loaded")
    
    # Load liabilities
    if 'liabilities' in data_dict:
        liabilities_df = data_dict['liabilities']
        if len(liabilities_df) > 0:
            print(f"Loading {len(liabilities_df)} liabilities...")
            for _, liability in liabilities_df.iterrows():
                Liability.save(
                    account_id=liability['account_id'],
                    user_id=liability['user_id'],
                    liability_type=liability.get('type'),
                    apr=float(liability.get('apr') or liability.get('apr_percentage', 0)) if pd.notna(liability.get('apr')) or pd.notna(liability.get('apr_percentage')) else None,
                    minimum_payment=float(liability.get('minimum_payment') or liability.get('minimum_payment_amount', 0)) if pd.notna(liability.get('minimum_payment')) or pd.notna(liability.get('minimum_payment_amount')) else None,
                    last_payment_date=liability.get('last_payment_date'),
                    last_payment_amount=float(liability['last_payment_amount']) if pd.notna(liability.get('last_payment_amount')) else None
                )
            print("✓ Liabilities loaded")
        else:
            print("✓ No liabilities to load")
    
    print("\n✓ All data loaded into database")


def get_data_from_db() -> dict:
    """
    Load data from SQLite database into DataFrames
    
    Returns:
        Dictionary with keys 'users', 'accounts', 'transactions', 'liabilities'
    """
    with get_db_connection() as conn:
        users_df = pd.read_sql_query('SELECT * FROM users', conn)
        accounts_df = pd.read_sql_query('SELECT * FROM accounts', conn)
        transactions_df = pd.read_sql_query('SELECT * FROM transactions', conn)
        liabilities_df = pd.read_sql_query('SELECT * FROM liabilities', conn)
        
        # Convert boolean columns
        if 'consent' in users_df.columns:
            users_df['consent'] = users_df['consent'].astype(bool)
        if 'pending' in transactions_df.columns:
            transactions_df['pending'] = transactions_df['pending'].astype(bool)
        
        return {
            'users': users_df,
            'accounts': accounts_df,
            'transactions': transactions_df,
            'liabilities': liabilities_df
        }

