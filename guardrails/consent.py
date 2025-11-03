"""
Consent management for SpendSense
Handles user consent tracking and validation
"""

import pandas as pd
from datetime import datetime


def check_consent(user_id, users_df):
    """
    Check if user has provided active consent

    Args:
        user_id: User ID to check
        users_df: DataFrame containing user data with consent column

    Returns:
        bool: True if user has active consent, False otherwise
    """
    user = users_df[users_df['user_id'] == user_id]
    if user.empty:
        return False

    return user.iloc[0].get('consent', False)


def update_consent_status(user_id, consent, users_df):
    """
    Update user consent status

    Args:
        user_id: User ID
        consent: Boolean consent status
        users_df: DataFrame containing user data

    Returns:
        bool: True if update successful, False otherwise
    """
    user_idx = users_df[users_df['user_id'] == user_id].index
    if user_idx.empty:
        return False

    users_df.loc[user_idx, 'consent'] = consent
    users_df.loc[user_idx, 'consent_date'] = datetime.now() if consent else None

    return True


def record_consent(user_id, consent_timestamp=None):
    """
    Record consent event for audit purposes

    Args:
        user_id: User ID
        consent_timestamp: Timestamp of consent (default: now)

    Returns:
        dict: Consent record
    """
    if consent_timestamp is None:
        consent_timestamp = datetime.now()

    return {
        'user_id': user_id,
        'consent_timestamp': consent_timestamp,
        'action': 'consent_granted' if consent else 'consent_revoked'
    }


def validate_consent_for_processing(user_id, users_df):
    """
    Validate that user has consent before processing data

    Args:
        user_id: User ID
        users_df: DataFrame containing user data

    Returns:
        tuple: (is_valid, error_message)
    """
    if not check_consent(user_id, users_df):
        return False, "User has not provided consent for data processing"

    return True, None


if __name__ == '__main__':
    # Test consent management
    test_users = pd.DataFrame({
        'user_id': ['user_0001', 'user_0002'],
        'consent': [True, False]
    })

    print(f"User 0001 consent: {check_consent('user_0001', test_users)}")
    print(f"User 0002 consent: {check_consent('user_0002', test_users)}")

    update_consent_status('user_0002', True, test_users)
    print(f"User 0002 consent after update: {check_consent('user_0002', test_users)}")

