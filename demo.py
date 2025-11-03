"""
SpendSense Demo
Quick demonstration of all features including What-If scenarios
"""

import json
from ingest.data_generator import generate_synthetic_data
from features.signal_detection import detect_behavioral_signals
from personas.persona_assignment import assign_persona, get_persona_rationale
from recommend.recommendation_engine import generate_recommendations
from recommend.what_if_simulator import WhatIfSimulator


def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def demo_full_pipeline():
    """Demonstrate the complete SpendSense pipeline"""

    print_section("SPENSENSE DEMO")

    # Step 1: Generate Data
    print("1. Generating synthetic data...")
    data = generate_synthetic_data(num_users=50, output_dir='data')

    # Step 2: Find an interesting user (one with credit card)
    print("\n2. Finding user with diverse financial profile...")
    target_user = None
    for user_id in data['users']['user_id']:
        user_accounts = data['accounts'][data['accounts']['user_id'] == user_id]
        credit_cards = user_accounts[user_accounts['type'] == 'credit card']

        if not credit_cards.empty and data['users'][data['users']['user_id'] == user_id].iloc[0]['consent']:
            target_user = user_id
            break

    if not target_user:
        print("No suitable user found with consent and credit card")
        return

    print(f"   Selected user: {target_user}")

    # Step 3: Detect Behavioral Signals
    print_section("BEHAVIORAL SIGNALS")

    signals = detect_behavioral_signals(
        target_user,
        data['transactions'],
        data['accounts'],
        data['liabilities']
    )

    print("Subscriptions:")
    print(f"  - Recurring merchants: {signals['subscriptions']['num_recurring_merchants']}")
    print(f"  - Monthly recurring spend: ${signals['subscriptions']['monthly_recurring_spend']:.2f}")
    print(f"  - Subscription share: {signals['subscriptions']['subscription_share']:.1f}%")

    print("\nSavings:")
    print(f"  - Current balance: ${signals['savings']['current_savings_balance']:,.2f}")
    print(f"  - Monthly inflow: ${signals['savings']['monthly_savings_inflow']:.2f}")
    print(f"  - Emergency fund coverage: {signals['savings']['emergency_fund_coverage']:.1f} months")

    print("\nCredit:")
    print(f"  - Has credit card: {signals['credit']['has_credit_card']}")
    if signals['credit']['has_credit_card']:
        print(f"  - Max utilization: {signals['credit']['max_utilization']:.1f}%")
        print(f"  - Total balance: ${signals['credit']['total_credit_balance']:,.2f}")
        print(f"  - Total limit: ${signals['credit']['total_credit_limit']:,.2f}")

    print("\nIncome:")
    print(f"  - Has payroll: {signals['income']['has_payroll']}")
    if signals['income']['has_payroll']:
        print(f"  - Median pay gap: {signals['income']['median_pay_gap']:.0f} days")
        print(f"  - Cash flow buffer: {signals['income']['cash_flow_buffer']:.1f} months")

    # Step 4: Assign Persona
    print_section("PERSONA ASSIGNMENT")

    persona = assign_persona(signals)
    rationale = get_persona_rationale(persona['primary_persona'], signals)

    print(f"Primary Persona: {persona['persona_name']}")
    print(f"Focus: {persona['primary_focus']}")
    print(f"\nRationale: {rationale}")

    if len(persona['matched_personas']) > 1:
        print(f"\nAlso matched: {', '.join(persona['matched_personas'][1:])}")

    # Step 5: Generate Recommendations
    print_section("PERSONALIZED RECOMMENDATIONS")

    recommendations = generate_recommendations(
        target_user,
        persona,
        signals,
        data['accounts']
    )

    print("Education Content:")
    for i, edu in enumerate(recommendations['education'][:3], 1):
        print(f"\n  {i}. {edu['title']} ({edu['type']})")
        print(f"     Because: {edu['rationale']}")

    print("\n\nPartner Offers:")
    for i, offer in enumerate(recommendations['offers'][:2], 1):
        print(f"\n  {i}. {offer['title']}")
        print(f"     {offer['description']}")
        print(f"     Because: {offer['rationale']}")

    print(f"\n\nDisclaimer: {recommendations['disclaimer']}")

    # Step 6: What-If Scenarios
    print_section("WHAT-IF SCENARIOS")

    user_accounts = data['accounts'][data['accounts']['user_id'] == target_user]
    user_liabilities = data['liabilities'][
        data['liabilities']['account_id'].isin(user_accounts['account_id'])
    ]

    simulator = WhatIfSimulator(signals, user_accounts, user_liabilities)

    # Scenario 1: Extra Credit Card Payment
    if signals['credit']['has_credit_card']:
        print("SCENARIO 1: What if I pay $200/month extra on my credit card?")
        print("-" * 70)

        credit_cards = user_accounts[user_accounts['type'] == 'credit card']
        if not credit_cards.empty:
            result = simulator.simulate_extra_credit_payment(
                credit_cards.iloc[0]['account_id'],
                extra_monthly_payment=200
            )

            print(f"Current balance: ${result['current_balance']:,.2f}")
            print(f"Credit limit: ${result['credit_limit']:,.2f}")
            print(f"APR: {result['apr']:.2f}%")
            print(f"\nCurrent plan (minimum payments):")
            print(f"  - Monthly payment: ${result['current_scenario']['monthly_payment']:.2f}")
            print(f"  - Months to payoff: {result['current_scenario']['months_to_payoff']:.0f}")
            print(f"  - Total interest: ${result['current_scenario']['total_interest']:,.2f}")
            print(f"\nWith $200 extra per month:")
            print(f"  - Monthly payment: ${result['extra_payment_scenario']['monthly_payment']:.2f}")
            print(f"  - Months to payoff: {result['extra_payment_scenario']['months_to_payoff']:.0f}")
            print(f"  - Total interest: ${result['extra_payment_scenario']['total_interest']:,.2f}")
            print(f"\n💰 SAVINGS:")
            print(f"  - Interest saved: ${result['savings']['interest_saved']:,.2f}")
            print(f"  - Months saved: {result['savings']['months_saved']:.0f}")
            print(f"  - {result['recommendation']}")

    # Scenario 2: Cancel Subscriptions
    print("\n\nSCENARIO 2: What if I cancel 3 subscriptions?")
    print("-" * 70)

    subs_to_cancel = [
        {'name': 'Netflix', 'amount': 15.99},
        {'name': 'Spotify', 'amount': 10.99},
        {'name': 'Gym Membership', 'amount': 45.00}
    ]

    result = simulator.simulate_subscription_cancellation(subs_to_cancel)

    print("Subscriptions to cancel:")
    for sub in subs_to_cancel:
        print(f"  - {sub['name']}: ${sub['amount']:.2f}/month")

    print(f"\n💰 SAVINGS:")
    print(f"  - Monthly savings: ${result['monthly_savings']:.2f}")
    print(f"  - Annual savings: ${result['annual_savings']:.2f}")
    print(f"  - Percent reduction: {result['percent_reduction']:.1f}%")
    print(f"\n  {result['recommendation']}")

    print("\n  Alternative uses for this money:")
    for alt in result['alternative_uses']:
        print(f"    • {alt}")

    # Scenario 3: Increase Savings
    print("\n\nSCENARIO 3: What if I save $500/month for a year?")
    print("-" * 70)

    result = simulator.simulate_increased_savings(
        monthly_amount=500,
        target_amount=10000,
        months=12
    )

    print(f"Current savings: ${result['current_state']['savings_balance']:,.2f}")
    print(f"Monthly contribution: ${result['monthly_contribution']:.2f}")
    print(f"Investment APY: {result['growth']['annual_apy']}%")

    print(f"\n📈 PROJECTION (12 months):")
    print(f"  - Final balance: ${result['projected_state']['final_balance']:,.2f}")
    print(f"  - Your contributions: ${result['projected_state']['total_contributions']:,.2f}")
    print(f"  - Interest earned: ${result['projected_state']['interest_earned']:,.2f}")
    print(f"  - Emergency fund: {result['projected_state']['emergency_fund_months']:.1f} months")

    if result['months_to_target']:
        print(f"\n  Time to reach ${result['target_amount']:,.0f} goal: {result['months_to_target']} months")

    print(f"\n  {result['recommendation']}")

    print_section("DEMO COMPLETE")
    print("SpendSense successfully demonstrated:")
    print("  ✓ Synthetic data generation")
    print("  ✓ Behavioral signal detection")
    print("  ✓ Persona assignment with rationales")
    print("  ✓ Personalized recommendations")
    print("  ✓ What-If scenario simulations")
    print("\nRun 'python app.py' to start the API server")
    print("="*70 + "\n")


if __name__ == '__main__':
    demo_full_pipeline()
