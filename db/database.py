"""
Database connection and initialization
"""

import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime

DB_PATH = os.getenv('SPENDSENSE_DB_PATH', 'data/spendsense.db')


def get_db_path():
    """Get the database path, creating directory if needed"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return DB_PATH


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row  # Enable column access by name
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database schema"""
    print(f"Initializing database at {get_db_path()}...")
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                income_level TEXT,
                consent BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Accounts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accounts (
                account_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                subtype TEXT,
                balance_current REAL DEFAULT 0,
                balance_available REAL,
                balance_limit REAL,
                iso_currency_code TEXT DEFAULT 'USD',
                holder_category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                date DATE NOT NULL,
                amount REAL NOT NULL,
                merchant_name TEXT,
                payment_channel TEXT,
                category_primary TEXT,
                category_detailed TEXT,
                pending BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
            )
        ''')
        
        # Liabilities table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS liabilities (
                liability_id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                type TEXT,
                apr REAL,
                minimum_payment REAL,
                last_payment_date DATE,
                last_payment_amount REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Persona assignments (historical)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS persona_assignments (
                assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                primary_persona TEXT,
                persona_name TEXT,
                primary_focus TEXT,
                rationale TEXT,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Behavioral signals (historical)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS behavioral_signals (
                signal_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                signal_type TEXT NOT NULL,  -- subscriptions, savings, credit, income
                signal_data TEXT,  -- JSON string of signal details
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Recommendations (historical)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recommendations (
                recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                url TEXT,
                type TEXT NOT NULL,  -- education, partner_offer
                rationale TEXT,
                persona TEXT,
                decision_trace TEXT,  -- JSON string
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Recommendation views
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recommendation_views (
                view_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                recommendation_id INTEGER,
                recommendation_title TEXT,  -- Store title in case recommendation is deleted
                type TEXT,
                persona TEXT,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id) ON DELETE SET NULL
            )
        ''')
        
        # Recommendation acceptances
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recommendation_acceptances (
                acceptance_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                recommendation_id INTEGER,
                recommendation_title TEXT,
                type TEXT,
                persona TEXT,
                action TEXT,  -- clicked, dismissed, etc.
                accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id) ON DELETE SET NULL
            )
        ''')
        
        # User sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_persona_assignments_user_id ON persona_assignments(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_persona_assignments_assigned_at ON persona_assignments(assigned_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_behavioral_signals_user_id ON behavioral_signals(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendations_generated_at ON recommendations(generated_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendation_views_user_id ON recommendation_views(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendation_views_viewed_at ON recommendation_views(viewed_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendation_acceptances_user_id ON recommendation_acceptances(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recommendation_acceptances_accepted_at ON recommendation_acceptances(accepted_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token)')
        
        conn.commit()
        
    print("✓ Database initialized")


def check_db_exists():
    """Check if database exists"""
    return os.path.exists(get_db_path())


if __name__ == '__main__':
    init_db()
    print("Database setup complete!")

