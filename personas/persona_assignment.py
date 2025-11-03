"""
Persona assignment system for SpendSense
Assigns users to one of 5 personas based on behavioral signals
"""

PERSONA_DEFINITIONS = {
    'high_utilization': {
        'name': 'High Utilization',
        'criteria': 'Credit card utilization ≥50% OR interest charges OR minimum-payment-only OR overdue',
        'primary_focus': 'Reduce utilization and interest; payment planning and autopay education',
        'priority': 1  # Highest priority - financial health concern
    },
    'variable_income': {
        'name': 'Variable Income Budgeter',
        'criteria': 'Median pay gap > 45 days AND cash-flow buffer < 1 month',
        'primary_focus': 'Percent-based budgets, emergency fund basics, smoothing strategies',
        'priority': 2
    },
    'subscription_heavy': {
        'name': 'Subscription-Heavy',
        'criteria': 'Recurring merchants ≥3 AND (monthly recurring spend ≥$50 OR subscription share ≥10%)',
        'primary_focus': 'Subscription audit, cancellation/negotiation tips, bill alerts',
        'priority': 3
    },
    'savings_builder': {
        'name': 'Savings Builder',
        'criteria': 'Savings growth ≥2% OR net savings inflow ≥$200/month, AND all cards <30% utilization',
        'primary_focus': 'Goal setting, automation, APY optimization (HYSA/CD basics)',
        'priority': 5  # Lowest priority - already doing well
    },
    'emergency_fund_starter': {
        'name': 'Emergency Fund Starter',
        'criteria': 'Emergency fund coverage < 1 month AND stable income AND no high utilization',
        'primary_focus': 'Building emergency fund, automatic transfers, short-term savings goals',
        'priority': 4,
        'rationale': 'Users with stable income but insufficient emergency savings need focused guidance on building financial resilience'
    }
}


def check_high_utilization(signals):
    """Check if user matches High Utilization persona"""
    credit = signals['credit']

    if not credit['has_credit_card']:
        return False

    return (
        credit['max_utilization'] >= 50 or
        credit.get('has_interest_charges', False) or
        credit.get('minimum_payment_only', False) or
        credit.get('is_overdue', False)
    )


def check_variable_income(signals):
    """Check if user matches Variable Income Budgeter persona"""
    income = signals['income']

    return (
        income['has_payroll'] and
        income['median_pay_gap'] > 45 and
        income['cash_flow_buffer'] < 1
    )


def check_subscription_heavy(signals):
    """Check if user matches Subscription-Heavy persona"""
    subs = signals['subscriptions']

    return (
        subs['num_recurring_merchants'] >= 3 and
        (subs['monthly_recurring_spend'] >= 50 or subs['subscription_share'] >= 10)
    )


def check_savings_builder(signals):
    """Check if user matches Savings Builder persona"""
    savings = signals['savings']
    credit = signals['credit']

    # Must have low credit utilization
    if credit['has_credit_card'] and credit['max_utilization'] >= 30:
        return False

    return (
        savings.get('savings_growth_rate', 0) >= 2 or
        savings.get('monthly_savings_inflow', 0) >= 200
    )


def check_emergency_fund_starter(signals):
    """Check if user matches Emergency Fund Starter persona (custom persona)"""
    savings = signals['savings']
    income = signals['income']
    credit = signals['credit']

    # Has stable income
    stable_income = (
        income.get('has_payroll', False) and
        income.get('median_pay_gap', 999) <= 31 and  # Monthly or bi-weekly
        income.get('pay_variability', 999) < 7  # Low variability
    )

    # Emergency fund coverage < 1 month
    low_emergency_fund = savings.get('emergency_fund_coverage', 0) < 1

    # No high credit utilization issues
    no_credit_issues = (
        not credit['has_credit_card'] or
        credit['max_utilization'] < 50
    )

    return stable_income and low_emergency_fund and no_credit_issues


def assign_persona(signals):
    """
    Assign persona to user based on behavioral signals

    Priority order (highest to lowest):
    1. High Utilization - urgent financial health concern
    2. Variable Income Budgeter - income stability issue
    3. Subscription-Heavy - spending optimization opportunity
    4. Emergency Fund Starter - savings building need
    5. Savings Builder - already on good track

    Args:
        signals: Dictionary of behavioral signals from detect_behavioral_signals()

    Returns:
        Dictionary with persona assignment and matching criteria
    """
    persona_checks = [
        ('high_utilization', check_high_utilization),
        ('variable_income', check_variable_income),
        ('subscription_heavy', check_subscription_heavy),
        ('emergency_fund_starter', check_emergency_fund_starter),
        ('savings_builder', check_savings_builder),
    ]

    matched_personas = []

    for persona_id, check_func in persona_checks:
        if check_func(signals):
            matched_personas.append(persona_id)

    # Select primary persona by priority
    if matched_personas:
        # Sort by priority
        matched_personas.sort(key=lambda p: PERSONA_DEFINITIONS[p]['priority'])
        primary_persona = matched_personas[0]
    else:
        # Default persona if none match
        primary_persona = None

    return {
        'primary_persona': primary_persona,
        'matched_personas': matched_personas,
        'persona_name': PERSONA_DEFINITIONS[primary_persona]['name'] if primary_persona else 'Unassigned',
        'primary_focus': PERSONA_DEFINITIONS[primary_persona]['primary_focus'] if primary_persona else 'General financial education',
        'persona_details': PERSONA_DEFINITIONS[primary_persona] if primary_persona else None
    }


def get_persona_rationale(persona_id, signals):
    """
    Generate plain-language rationale for persona assignment

    Args:
        persona_id: The assigned persona ID
        signals: Behavioral signals

    Returns:
        String with explanation of why this persona was assigned
    """
    if persona_id == 'high_utilization':
        credit = signals['credit']
        reasons = []

        if credit['max_utilization'] >= 50:
            reasons.append(f"credit card utilization at {credit['max_utilization']:.1f}%")

        if credit['is_overdue']:
            reasons.append("overdue payments detected")

        if credit['minimum_payment_only']:
            reasons.append("making minimum payments only")

        if credit['has_interest_charges']:
            reasons.append("accruing interest charges")

        return f"You have {', '.join(reasons)}. Focus on reducing credit utilization and interest costs."

    elif persona_id == 'variable_income':
        income = signals['income']
        return f"Your income arrives every {income['median_pay_gap']:.0f} days on average, and you have {income['cash_flow_buffer']:.1f} months of cash buffer. Building emergency reserves and using percent-based budgets can help smooth irregular income."

    elif persona_id == 'subscription_heavy':
        subs = signals['subscriptions']
        return f"You have {subs['num_recurring_merchants']} recurring subscriptions costing ${subs['monthly_recurring_spend']:.2f} per month ({subs['subscription_share']:.1f}% of spending). Auditing subscriptions could free up significant money."

    elif persona_id == 'savings_builder':
        savings = signals['savings']
        return f"You're saving ${savings['monthly_savings_inflow']:.2f} per month with {savings['emergency_fund_coverage']:.1f} months of emergency coverage. Let's optimize your savings strategy with better accounts and automation."

    elif persona_id == 'emergency_fund_starter':
        savings = signals['savings']
        income = signals['income']
        return f"You have stable income (every {income['median_pay_gap']:.0f} days), but only {savings['emergency_fund_coverage']:.1f} months of emergency savings. Building a 3-6 month emergency fund should be your priority."

    return "Based on your financial patterns, we've selected educational content to help you build better financial habits."


if __name__ == '__main__':
    # Test with sample signals
    import json
    from features.signal_detection import detect_behavioral_signals
    from ingest.data_generator import generate_synthetic_data

    data = generate_synthetic_data(num_users=10)

    for user_id in data['users']['user_id'][:5]:
        signals = detect_behavioral_signals(
            user_id,
            data['transactions'],
            data['accounts'],
            data['liabilities']
        )

        persona = assign_persona(signals)
        rationale = get_persona_rationale(persona['primary_persona'], signals) if persona['primary_persona'] else None

        print(f"\n{'='*60}")
        print(f"User: {user_id}")
        print(f"Persona: {persona['persona_name']}")
        print(f"Rationale: {rationale}")
        print(f"All matched: {', '.join(persona['matched_personas']) if persona['matched_personas'] else 'None'}")
