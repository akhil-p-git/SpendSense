"""
Database utility functions for querying data
"""

import pandas as pd
from .database import get_db_connection
from .models import User, Account, Transaction, Liability


def get_users_df() -> pd.DataFrame:
    """Get all users as DataFrame"""
    with get_db_connection() as conn:
        return pd.read_sql_query('SELECT * FROM users', conn)


def get_accounts_df() -> pd.DataFrame:
    """Get all accounts as DataFrame"""
    with get_db_connection() as conn:
        return pd.read_sql_query('SELECT * FROM accounts', conn)


def get_transactions_df() -> pd.DataFrame:
    """Get all transactions as DataFrame"""
    with get_db_connection() as conn:
        return pd.read_sql_query('SELECT * FROM transactions', conn)


def get_liabilities_df() -> pd.DataFrame:
    """Get all liabilities as DataFrame"""
    with get_db_connection() as conn:
        return pd.read_sql_query('SELECT * FROM liabilities', conn)


def get_user_transactions_df(user_id: str) -> pd.DataFrame:
    """Get transactions for a user as DataFrame"""
    with get_db_connection() as conn:
        query = '''
            SELECT t.* FROM transactions t
            JOIN accounts a ON t.account_id = a.account_id
            WHERE a.user_id = ?
        '''
        return pd.read_sql_query(query, conn, params=(user_id,))


def get_user_accounts_df(user_id: str) -> pd.DataFrame:
    """Get accounts for a user as DataFrame"""
    with get_db_connection() as conn:
        query = 'SELECT * FROM accounts WHERE user_id = ?'
        return pd.read_sql_query(query, conn, params=(user_id,))


def get_user_liabilities_df(user_id: str) -> pd.DataFrame:
    """Get liabilities for a user as DataFrame"""
    with get_db_connection() as conn:
        query = 'SELECT * FROM liabilities WHERE user_id = ?'
        return pd.read_sql_query(query, conn, params=(user_id,))


def get_all_data() -> dict:
    """Get all data as DataFrames (for compatibility with existing code)"""
    return {
        'users': get_users_df(),
        'accounts': get_accounts_df(),
        'transactions': get_transactions_df(),
        'liabilities': get_liabilities_df()
    }

