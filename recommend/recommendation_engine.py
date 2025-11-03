"""
Recommendation engine for SpendSense
Generates personalized education content and partner offers with rationales
"""

EDUCATION_CONTENT = {
    'high_utilization': [
        {
            'title': 'Understanding Credit Utilization and Your Credit Score',
            'type': 'article',
            'url': '/education/credit-utilization',
            'description': 'Learn how credit utilization affects your credit score and strategies to reduce it'
        },
        {
            'title': 'Debt Avalanche vs Snowball: Which Payoff Strategy Is Right for You?',
            'type': 'article',
            'url': '/education/debt-payoff-strategies',
            'description': 'Compare proven methods for paying down credit card debt faster'
        },
        {
            'title': 'Set Up Autopay to Never Miss a Payment',
            'type': 'guide',
            'url': '/education/autopay-setup',
            'description': 'Step-by-step guide to setting up automatic payments and avoiding late fees'
        },
        {
            'title': 'Credit Card Interest Calculator',
            'type': 'calculator',
            'url': '/tools/interest-calculator',
            'description': 'See how much interest you\'re paying and how extra payments can help'
        }
    ],
    'variable_income': [
        {
            'title': 'Budgeting with Variable Income: The Percentage Method',
            'type': 'article',
            'url': '/education/variable-income-budgeting',
            'description': 'Learn how to budget when your income fluctuates month to month'
        },
        {
            'title': 'Building an Emergency Fund on Irregular Income',
            'type': 'guide',
            'url': '/education/emergency-fund-irregular-income',
            'description': 'Strategies for building financial cushion with variable paychecks'
        },
        {
            'title': 'Income Smoothing Strategies for Freelancers',
            'type': 'article',
            'url': '/education/income-smoothing',
            'description': 'Techniques to create more predictable cash flow'
        }
    ],
    'subscription_heavy': [
        {
            'title': 'The Complete Subscription Audit Checklist',
            'type': 'checklist',
            'url': '/education/subscription-audit',
            'description': 'Step-by-step guide to reviewing and cutting unnecessary subscriptions'
        },
        {
            'title': 'How to Negotiate Lower Bills (Scripts Included)',
            'type': 'guide',
            'url': '/education/negotiate-bills',
            'description': 'Proven scripts for negotiating with service providers'
        },
        {
            'title': 'Subscription Management Best Practices',
            'type': 'article',
            'url': '/education/subscription-management',
            'description': 'Tools and strategies to track and optimize recurring charges'
        }
    ],
    'savings_builder': [
        {
            'title': 'High-Yield Savings Accounts: Complete Guide',
            'type': 'article',
            'url': '/education/high-yield-savings',
            'description': 'Learn about HYSA benefits and how to choose the right account'
        },
        {
            'title': 'Automate Your Savings: Set It and Forget It',
            'type': 'guide',
            'url': '/education/automate-savings',
            'description': 'How to set up automatic transfers to build wealth effortlessly'
        },
        {
            'title': 'Goal-Based Savings: The Bucket Method',
            'type': 'article',
            'url': '/education/savings-buckets',
            'description': 'Organize your savings into specific goals for better tracking'
        },
        {
            'title': 'Compound Interest Calculator',
            'type': 'calculator',
            'url': '/tools/compound-interest',
            'description': 'See how your savings will grow over time'
        }
    ],
    'emergency_fund_starter': [
        {
            'title': 'Emergency Fund 101: Why You Need One',
            'type': 'article',
            'url': '/education/emergency-fund-basics',
            'description': 'Learn why emergency funds are crucial for financial stability'
        },
        {
            'title': 'How to Build a $1,000 Emergency Fund in 90 Days',
            'type': 'guide',
            'url': '/education/build-emergency-fund',
            'description': 'Practical strategies to jumpstart your emergency savings'
        },
        {
            'title': 'Where to Keep Your Emergency Fund',
            'type': 'article',
            'url': '/education/emergency-fund-location',
            'description': 'Best accounts for emergency savings: accessibility vs. returns'
        }
    ]
}

PARTNER_OFFERS = {
    'high_utilization': [
        {
            'partner': 'Balance Transfer Card',
            'offer_type': 'credit_card',
            'title': '0% APR Balance Transfer for 18 Months',
            'description': 'Transfer high-interest balances and save on interest',
            'eligibility': {
                'min_credit_score': 670,
                'max_utilization': 85
            }
        },
        {
            'partner': 'Credit Counseling Network',
            'offer_type': 'service',
            'title': 'Free Debt Management Plan Review',
            'description': 'Work with certified counselors to create a payoff plan',
            'eligibility': {}
        }
    ],
    'variable_income': [
        {
            'partner': 'YNAB (You Need A Budget)',
            'offer_type': 'budgeting_app',
            'title': 'Try YNAB Free for 34 Days',
            'description': 'Budgeting app designed for variable income earners',
            'eligibility': {}
        }
    ],
    'subscription_heavy': [
        {
            'partner': 'Truebill',
            'offer_type': 'subscription_manager',
            'title': 'Track and Cancel Subscriptions Automatically',
            'description': 'Truebill finds and cancels unwanted subscriptions for you',
            'eligibility': {}
        },
        {
            'partner': 'Rocket Money',
            'offer_type': 'subscription_manager',
            'title': 'Negotiate Your Bills Automatically',
            'description': 'Let Rocket Money negotiate lower rates on your behalf',
            'eligibility': {}
        }
    ],
    'savings_builder': [
        {
            'partner': 'Marcus by Goldman Sachs',
            'offer_type': 'savings_account',
            'title': 'High-Yield Savings Account (4.5% APY)',
            'description': 'FDIC insured with no fees and easy transfers',
            'eligibility': {
                'must_not_have': 'savings'
            }
        },
        {
            'partner': 'Ally Bank',
            'offer_type': 'savings_account',
            'title': 'Online Savings Account (4.35% APY)',
            'description': 'No minimum balance, 24/7 customer service',
            'eligibility': {
                'must_not_have': 'savings'
            }
        }
    ],
    'emergency_fund_starter': [
        {
            'partner': 'Marcus by Goldman Sachs',
            'offer_type': 'savings_account',
            'title': 'High-Yield Savings Account (4.5% APY)',
            'description': 'Perfect for building emergency funds with high interest',
            'eligibility': {}
        }
    ]
}

DISCLAIMER = "This is educational content, not financial advice. Consult a licensed advisor for personalized guidance."


def check_offer_eligibility(offer, user_signals, user_accounts):
    """
    Check if user is eligible for a partner offer

    Args:
        offer: Partner offer dictionary
        user_signals: User's behavioral signals
        user_accounts: User's account data

    Returns:
        Tuple of (eligible: bool, reason: str)
    """
    eligibility = offer.get('eligibility', {})

    # Check credit score (if we had credit score data)
    if 'min_credit_score' in eligibility:
        # For demo, assume eligibility based on utilization
        if user_signals['credit']['max_utilization'] > 80:
            return False, "Credit utilization too high for this offer"

    # Check if user already has this type of account
    if 'must_not_have' in eligibility:
        account_type = eligibility['must_not_have']
        has_account = any(acc['type'] == account_type for _, acc in user_accounts.iterrows())
        if has_account:
            return False, f"You already have a {account_type} account"

    # Check max utilization
    if 'max_utilization' in eligibility:
        if user_signals['credit']['max_utilization'] > eligibility['max_utilization']:
            return False, "Credit utilization exceeds requirements for this offer"

    return True, "Eligible"


def generate_recommendation_rationale(persona_id, signals, item_title):
    """
    Generate a "because" rationale for a recommendation

    Args:
        persona_id: User's assigned persona
        signals: Behavioral signals
        item_title: Title of recommended item

    Returns:
        String with plain-language rationale
    """
    if persona_id == 'high_utilization':
        credit = signals['credit']
        if credit['num_credit_cards'] > 0:
            util = credit['max_utilization']
            balance = credit['total_credit_balance']
            return f"Your credit card utilization is at {util:.1f}% (${balance:,.2f} balance). This content can help you reduce interest charges and improve your credit score."

    elif persona_id == 'variable_income':
        income = signals['income']
        return f"Your income arrives every {income['median_pay_gap']:.0f} days on average with {income['cash_flow_buffer']:.1f} months of buffer. This will help you manage cash flow between paychecks."

    elif persona_id == 'subscription_heavy':
        subs = signals['subscriptions']
        return f"You have {subs['num_recurring_merchants']} recurring subscriptions costing ${subs['monthly_recurring_spend']:.2f}/month ({subs['subscription_share']:.1f}% of spending). This could help you save money."

    elif persona_id == 'savings_builder':
        savings = signals['savings']
        return f"You're saving ${savings['monthly_savings_inflow']:.2f}/month with ${savings['current_savings_balance']:,.2f} in savings. This will help you optimize your strategy."

    elif persona_id == 'emergency_fund_starter':
        savings = signals['savings']
        return f"You currently have {savings['emergency_fund_coverage']:.1f} months of emergency savings. Building to 3-6 months will provide crucial financial security."

    return "Based on your financial patterns, this content is relevant to your situation."


def generate_recommendations(user_id, persona, signals, accounts_df):
    """
    Generate personalized recommendations for a user

    Args:
        user_id: User ID
        persona: Assigned persona from persona_assignment
        signals: Behavioral signals
        accounts_df: User's accounts

    Returns:
        Dictionary with education items and partner offers, each with rationales
    """
    persona_id = persona['primary_persona']

    if not persona_id:
        return {
            'user_id': user_id,
            'persona': 'Unassigned',
            'education': [],
            'offers': [],
            'disclaimer': DISCLAIMER
        }

    # Get education content for this persona
    education_items = EDUCATION_CONTENT.get(persona_id, [])[:4]  # Top 4

    # Add rationales to education items
    education_with_rationales = []
    for item in education_items:
        education_with_rationales.append({
            **item,
            'rationale': generate_recommendation_rationale(persona_id, signals, item['title'])
        })

    # Get partner offers
    offers = PARTNER_OFFERS.get(persona_id, [])

    # Filter by eligibility
    user_accounts = accounts_df[accounts_df['user_id'] == user_id]
    eligible_offers = []

    for offer in offers:
        is_eligible, reason = check_offer_eligibility(offer, signals, user_accounts)
        if is_eligible:
            eligible_offers.append({
                **offer,
                'rationale': generate_recommendation_rationale(persona_id, signals, offer['title']),
                'eligible': True
            })

    return {
        'user_id': user_id,
        'persona': persona['persona_name'],
        'persona_focus': persona['primary_focus'],
        'education': education_with_rationales,
        'offers': eligible_offers[:3],  # Max 3 offers
        'disclaimer': DISCLAIMER,
        'timestamp': pd.Timestamp.now().isoformat()
    }


if __name__ == '__main__':
    import json
    import pandas as pd
    from features.signal_detection import detect_behavioral_signals
    from personas.persona_assignment import assign_persona
    from ingest.data_generator import generate_synthetic_data

    data = generate_synthetic_data(num_users=10)

    user_id = data['users']['user_id'].iloc[0]
    signals = detect_behavioral_signals(
        user_id,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    persona = assign_persona(signals)
    recommendations = generate_recommendations(user_id, persona, signals, data['accounts'])

    print(json.dumps(recommendations, indent=2))
