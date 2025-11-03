"""
Eligibility checks for SpendSense recommendations
Filters out ineligible offers and products
"""

import pandas as pd


# Prohibited products (predatory or high-risk)
PROHIBITED_PRODUCTS = [
    'payday_loan',
    'title_loan',
    'cash_advance',
    'check_cashing'
]

# Minimum requirements for different product types
PRODUCT_REQUIREMENTS = {
    'balance_transfer_card': {
        'min_credit_score': 650,
        'max_utilization': 90,  # Don't offer if utilization too high
        'required_signals': ['has_credit_card']
    },
    'high_yield_savings': {
        'min_income': None,  # No minimum
        'max_existing_savings_rate': None,
        'required_signals': []
    },
    'budgeting_app': {
        'required_signals': ['has_payroll']  # Need income to budget
    },
    'subscription_manager': {
        'required_signals': ['subscriptions'],
        'min_subscriptions': 3
    }
}


def check_eligibility(user_id, product_type, signals, accounts_df):
    """
    Check if user is eligible for a specific product

    Args:
        user_id: User ID
        product_type: Type of product (e.g., 'balance_transfer_card')
        signals: Behavioral signals dict
        accounts_df: User's accounts

    Returns:
        tuple: (is_eligible, reason)
    """
    # Check if product is prohibited
    if product_type in PROHIBITED_PRODUCTS:
        return False, f"Product {product_type} is prohibited"

    # Check product-specific requirements
    if product_type not in PRODUCT_REQUIREMENTS:
        return True, "No specific requirements"

    requirements = PRODUCT_REQUIREMENTS[product_type]

    # Check required signals
    if 'required_signals' in requirements:
        for required_signal in requirements['required_signals']:
            if required_signal not in signals:
                return False, f"Missing required signal: {required_signal}"

    # Check credit utilization for balance transfer cards
    if product_type == 'balance_transfer_card':
        credit_signals = signals.get('credit', {})
        if credit_signals.get('max_utilization', 0) > requirements['max_utilization']:
            return False, f"Credit utilization too high ({credit_signals.get('max_utilization', 0):.1f}%)"

    # Check subscription count for subscription manager
    if product_type == 'subscription_manager':
        sub_signals = signals.get('subscriptions', {})
        if sub_signals.get('num_recurring_merchants', 0) < requirements['min_subscriptions']:
            return False, f"Not enough subscriptions ({sub_signals.get('num_recurring_merchants', 0)} < {requirements['min_subscriptions']})"

    # Check if user already has this product
    if _user_has_existing_product(product_type, accounts_df):
        return False, f"User already has {product_type}"

    return True, "Eligible"


def _user_has_existing_product(product_type, accounts_df):
    """
    Check if user already has a similar product

    Args:
        product_type: Type of product to check
        accounts_df: User's accounts

    Returns:
        bool: True if user has existing product
    """
    if product_type == 'high_yield_savings':
        # Check if user has savings account
        return not accounts_df[accounts_df['type'] == 'savings'].empty

    if product_type == 'balance_transfer_card':
        # User already has credit cards (ok to offer another)
        return False  # Allow multiple cards

    return False


def filter_ineligible_offers(recommendations, user_id, signals, accounts_df):
    """
    Filter out ineligible partner offers from recommendations

    Args:
        recommendations: List of recommendation dicts
        user_id: User ID
        signals: Behavioral signals
        accounts_df: User's accounts

    Returns:
        list: Filtered recommendations (only eligible offers)
    """
    filtered = []

    for rec in recommendations:
        if rec.get('type') != 'partner_offer':
            # Education content doesn't need eligibility checks
            filtered.append(rec)
            continue

        product_type = rec.get('product_type')
        if product_type:
            is_eligible, reason = check_eligibility(user_id, product_type, signals, accounts_df)
            if is_eligible:
                rec['eligibility_passed'] = True
                filtered.append(rec)
            else:
                rec['eligibility_passed'] = False
                rec['eligibility_reason'] = reason
                # Optionally log or track filtered offers

    return filtered


def check_minimum_requirements(product_type, user_data):
    """
    Check if user meets minimum requirements for a product

    Args:
        product_type: Type of product
        user_data: User data dict

    Returns:
        tuple: (meets_requirements, missing_requirements)
    """
    if product_type not in PRODUCT_REQUIREMENTS:
        return True, []

    requirements = PRODUCT_REQUIREMENTS[product_type]
    missing = []

    if 'min_credit_score' in requirements:
        credit_score = user_data.get('credit_score')
        if not credit_score or credit_score < requirements['min_credit_score']:
            missing.append(f"Credit score {credit_score} below minimum {requirements['min_credit_score']}")

    if 'min_income' in requirements and requirements['min_income']:
        income = user_data.get('income')
        if not income or income < requirements['min_income']:
            missing.append(f"Income ${income} below minimum ${requirements['min_income']}")

    return len(missing) == 0, missing


if __name__ == '__main__':
    # Test eligibility checks
    test_signals = {
        'credit': {
            'has_credit_card': True,
            'max_utilization': 68.0
        },
        'subscriptions': {
            'num_recurring_merchants': 5
        }
    }

    test_accounts = pd.DataFrame({
        'user_id': ['user_0001'],
        'type': ['checking'],
        'account_id': ['acc_001']
    })

    # Test balance transfer card eligibility
    is_eligible, reason = check_eligibility('user_0001', 'balance_transfer_card', test_signals, test_accounts)
    print(f"Balance transfer card eligible: {is_eligible}, reason: {reason}")

    # Test subscription manager eligibility
    is_eligible, reason = check_eligibility('user_0001', 'subscription_manager', test_signals, test_accounts)
    print(f"Subscription manager eligible: {is_eligible}, reason: {reason}")

