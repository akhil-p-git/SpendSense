"""
What-If Scenario Simulator for SpendSense
Allows users to model financial decisions and see projected outcomes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


class WhatIfSimulator:
    """
    Simulate financial scenarios to help users make informed decisions

    Supported scenarios:
    1. Extra credit card payments
    2. Subscription cancellations
    3. Increased savings contributions
    """

    def __init__(self, user_signals, accounts_df, liabilities_df):
        """
        Initialize simulator with user's current financial state

        Args:
            user_signals: Behavioral signals from detect_behavioral_signals()
            accounts_df: User's accounts
            liabilities_df: User's liabilities
        """
        self.signals = user_signals
        self.accounts = accounts_df
        self.liabilities = liabilities_df

    def simulate_extra_credit_payment(self, account_id, extra_monthly_payment, months=12):
        """
        Simulate paying extra on a credit card

        Args:
            account_id: Credit card account ID
            extra_monthly_payment: Additional amount to pay per month
            months: Number of months to simulate

        Returns:
            Dictionary with projection results
        """
        # Get account and liability info
        account_rows = self.accounts[self.accounts['account_id'] == account_id]
        if account_rows.empty:
            raise ValueError(f"Account {account_id} not found for user")
        
        account = account_rows.iloc[0]
        
        liability_rows = self.liabilities[self.liabilities['account_id'] == account_id]
        if liability_rows.empty:
            raise ValueError(f"Liability information not found for account {account_id}")
        
        liability = liability_rows.iloc[0]

        current_balance = account['balance_current']
        credit_limit = account['balance_limit']
        apr = liability.get('apr') or liability.get('apr_percentage', 0)
        monthly_rate = apr / 100 / 12
        current_minimum = liability.get('minimum_payment') or liability.get('minimum_payment_amount', 0)

        # Calculate current payoff scenario (minimum payments only)
        current_scenario = self._amortize_debt(
            current_balance,
            monthly_rate,
            current_minimum
        )

        # Calculate extra payment scenario
        new_monthly_payment = current_minimum + extra_monthly_payment
        extra_scenario = self._amortize_debt(
            current_balance,
            monthly_rate,
            new_monthly_payment
        )

        # Calculate savings
        interest_saved = current_scenario['total_interest'] - extra_scenario['total_interest']
        months_saved = current_scenario['months_to_payoff'] - extra_scenario['months_to_payoff']

        # Calculate utilization improvement over time
        utilization_timeline = []
        balance = current_balance
        for month in range(min(months, int(extra_scenario['months_to_payoff']) + 1)):
            interest_charge = balance * monthly_rate
            balance = max(0, balance + interest_charge - new_monthly_payment)
            utilization = (balance / credit_limit * 100) if credit_limit > 0 else 0
            utilization_timeline.append({
                'month': month,
                'balance': balance,
                'utilization': utilization
            })

        return {
            'scenario_type': 'extra_credit_payment',
            'account_id': account_id,
            'current_balance': current_balance,
            'credit_limit': credit_limit,
            'apr': apr,
            'extra_payment': extra_monthly_payment,
            'current_scenario': {
                'monthly_payment': current_minimum,
                'months_to_payoff': current_scenario['months_to_payoff'],
                'total_interest': current_scenario['total_interest'],
                'total_paid': current_scenario['total_paid']
            },
            'extra_payment_scenario': {
                'monthly_payment': new_monthly_payment,
                'months_to_payoff': extra_scenario['months_to_payoff'],
                'total_interest': extra_scenario['total_interest'],
                'total_paid': extra_scenario['total_paid']
            },
            'savings': {
                'interest_saved': interest_saved,
                'months_saved': months_saved,
                'percent_interest_saved': (interest_saved / current_scenario['total_interest'] * 100) if current_scenario['total_interest'] > 0 else 0
            },
            'utilization_timeline': utilization_timeline,
            'recommendation': self._generate_credit_recommendation(interest_saved, months_saved)
        }

    def simulate_subscription_cancellation(self, subscriptions_to_cancel, months=12):
        """
        Simulate canceling subscriptions

        Args:
            subscriptions_to_cancel: List of subscription names and amounts
                                    [{'name': 'Netflix', 'amount': 15.99}, ...]
            months: Number of months to project

        Returns:
            Dictionary with savings projection
        """
        total_monthly_savings = sum(sub['amount'] for sub in subscriptions_to_cancel)

        # Project savings over time
        savings_timeline = []
        cumulative_savings = 0

        for month in range(months + 1):
            cumulative_savings = total_monthly_savings * month
            savings_timeline.append({
                'month': month,
                'monthly_savings': total_monthly_savings,
                'cumulative_savings': cumulative_savings
            })

        # Calculate as percentage of current subscription spend
        current_subscription_spend = self.signals['subscriptions']['monthly_recurring_spend']
        percent_reduction = (total_monthly_savings / current_subscription_spend * 100) if current_subscription_spend > 0 else 0

        return {
            'scenario_type': 'subscription_cancellation',
            'subscriptions_canceled': subscriptions_to_cancel,
            'monthly_savings': total_monthly_savings,
            'annual_savings': total_monthly_savings * 12,
            'current_subscription_spend': current_subscription_spend,
            'new_subscription_spend': current_subscription_spend - total_monthly_savings,
            'percent_reduction': percent_reduction,
            'savings_timeline': savings_timeline,
            'alternative_uses': self._generate_alternative_uses(total_monthly_savings),
            'recommendation': self._generate_subscription_recommendation(
                total_monthly_savings,
                subscriptions_to_cancel
            )
        }

    def simulate_increased_savings(self, monthly_amount, target_amount=None, months=12):
        """
        Simulate moving money to savings

        Args:
            monthly_amount: Amount to save per month
            target_amount: Optional savings goal
            months: Number of months to project

        Returns:
            Dictionary with savings growth projection
        """
        current_savings = self.signals['savings']['current_savings_balance']
        current_monthly_inflow = self.signals['savings']['monthly_savings_inflow']

        # Assume a high-yield savings APY (4.5%)
        annual_apy = 4.5
        monthly_rate = annual_apy / 100 / 12

        # Calculate growth with compound interest
        savings_timeline = []
        balance = current_savings

        for month in range(months + 1):
            if month > 0:
                # Add monthly contribution
                balance += monthly_amount
                # Add interest
                balance += balance * monthly_rate

            savings_timeline.append({
                'month': month,
                'balance': balance,
                'contributions': monthly_amount * month,
                'interest_earned': balance - current_savings - (monthly_amount * month)
            })

        final_balance = savings_timeline[-1]['balance']
        total_contributions = monthly_amount * months
        total_interest = savings_timeline[-1]['interest_earned']

        # Calculate emergency fund coverage
        avg_monthly_expenses = self.signals['savings']['emergency_fund_coverage'] * current_savings if current_savings > 0 else 3000
        if avg_monthly_expenses == 0:
            avg_monthly_expenses = 3000  # Default assumption

        current_coverage = current_savings / avg_monthly_expenses if avg_monthly_expenses > 0 else 0
        projected_coverage = final_balance / avg_monthly_expenses if avg_monthly_expenses > 0 else 0

        # Calculate months to reach target
        months_to_target = None
        if target_amount and target_amount > current_savings:
            months_to_target = self._calculate_months_to_savings_goal(
                current_savings,
                target_amount,
                monthly_amount,
                monthly_rate
            )

        return {
            'scenario_type': 'increased_savings',
            'monthly_contribution': monthly_amount,
            'target_amount': target_amount,
            'projection_months': months,
            'current_state': {
                'savings_balance': current_savings,
                'monthly_inflow': current_monthly_inflow,
                'emergency_fund_months': current_coverage
            },
            'projected_state': {
                'final_balance': final_balance,
                'total_contributions': total_contributions,
                'interest_earned': total_interest,
                'emergency_fund_months': projected_coverage
            },
            'growth': {
                'balance_increase': final_balance - current_savings,
                'percent_growth': ((final_balance / current_savings - 1) * 100) if current_savings > 0 else 0,
                'monthly_rate': monthly_rate,
                'annual_apy': annual_apy
            },
            'months_to_target': months_to_target,
            'savings_timeline': savings_timeline,
            'recommendation': self._generate_savings_recommendation(
                monthly_amount,
                projected_coverage,
                target_amount,
                months_to_target
            )
        }

    def simulate_combined_scenario(self, scenarios, months=12):
        """
        Simulate multiple changes at once

        Args:
            scenarios: List of scenario configs
                [
                    {'type': 'extra_credit_payment', 'account_id': '...', 'amount': 200},
                    {'type': 'subscription_cancellation', 'subscriptions': [...]},
                    {'type': 'increased_savings', 'amount': 500}
                ]
            months: Number of months to project

        Returns:
            Dictionary with combined impact
        """
        results = []
        total_monthly_impact = 0
        total_interest_saved = 0
        total_monthly_savings = 0

        for scenario in scenarios:
            if scenario['type'] == 'extra_credit_payment':
                result = self.simulate_extra_credit_payment(
                    scenario['account_id'],
                    scenario['amount'],
                    months
                )
                total_monthly_impact -= scenario['amount']  # Cash outflow
                total_interest_saved += result['savings']['interest_saved']
                results.append(result)

            elif scenario['type'] == 'subscription_cancellation':
                result = self.simulate_subscription_cancellation(
                    scenario['subscriptions'],
                    months
                )
                total_monthly_impact += result['monthly_savings']  # Cash inflow
                total_monthly_savings += result['monthly_savings']
                results.append(result)

            elif scenario['type'] == 'increased_savings':
                result = self.simulate_increased_savings(
                    scenario['amount'],
                    scenario.get('target_amount'),
                    months
                )
                total_monthly_impact -= scenario['amount']  # Cash outflow
                results.append(result)

        # Calculate net cash flow
        net_monthly_impact = total_monthly_impact + total_monthly_savings
        annual_impact = net_monthly_impact * 12

        return {
            'scenario_type': 'combined',
            'individual_scenarios': results,
            'monthly_cash_flow_impact': net_monthly_impact,
            'annual_cash_flow_impact': annual_impact,
            'total_interest_saved': total_interest_saved,
            'total_subscription_savings': total_monthly_savings * 12,
            'projection_months': months,
            'summary': self._generate_combined_summary(results),
            'recommendation': self._generate_combined_recommendation(
                net_monthly_impact,
                total_interest_saved,
                total_monthly_savings
            )
        }
    
    def calculate_goal_based_payment(self, account_id, target_months, max_monthly_payment=None):
        """
        Calculate required monthly payment to pay off debt in target months (goal-based planning)
        
        Args:
            account_id: Credit card account ID
            target_months: Target months to payoff (e.g., 12)
            max_monthly_payment: Optional maximum monthly payment user can afford
            
        Returns:
            Dictionary with required payment and comparison to current
        """
        # Get account and liability info
        account_rows = self.accounts[self.accounts['account_id'] == account_id]
        if account_rows.empty:
            raise ValueError(f"Account {account_id} not found for user")
        
        account = account_rows.iloc[0]
        liability_rows = self.liabilities[self.liabilities['account_id'] == account_id]
        if liability_rows.empty:
            raise ValueError(f"Liability information not found for account {account_id}")
        
        liability = liability_rows.iloc[0]
        
        current_balance = account['balance_current']
        apr = liability.get('apr') or liability.get('apr_percentage', 0)
        monthly_rate = apr / 100 / 12
        current_minimum = liability.get('minimum_payment') or liability.get('minimum_payment_amount', 0)
        
        # Calculate required payment using amortization formula
        if monthly_rate == 0:
            required_payment = current_balance / target_months
        else:
            # PMT formula: PMT = PV * r * (1 + r)^n / ((1 + r)^n - 1)
            numerator = monthly_rate * ((1 + monthly_rate) ** target_months)
            denominator = ((1 + monthly_rate) ** target_months) - 1
            required_payment = current_balance * (numerator / denominator)
        
        # Round up to nearest dollar
        required_payment = np.ceil(required_payment)
        
        # Check if exceeds max payment
        is_feasible = True
        if max_monthly_payment and required_payment > max_monthly_payment:
            is_feasible = False
            # Calculate actual months with max payment
            actual_scenario = self._amortize_debt(
                current_balance,
                monthly_rate,
                max_monthly_payment
            )
            actual_months = actual_scenario['months_to_payoff']
        else:
            actual_months = target_months
        
        # Calculate scenarios for comparison
        current_scenario = self._amortize_debt(
            current_balance,
            monthly_rate,
            current_minimum
        )
        
        goal_scenario = self._amortize_debt(
            current_balance,
            monthly_rate,
            required_payment
        )
        
        # Calculate impact
        interest_saved = current_scenario['total_interest'] - goal_scenario['total_interest']
        months_saved = current_scenario['months_to_payoff'] - actual_months
        
        return {
            'scenario_type': 'goal_based_payment',
            'account_id': account_id,
            'current_balance': current_balance,
            'target_months': target_months,
            'required_monthly_payment': float(required_payment),
            'current_minimum_payment': current_minimum,
            'payment_increase': float(required_payment - current_minimum),
            'is_feasible': is_feasible,
            'actual_months': actual_months if not is_feasible else target_months,
            'max_monthly_payment': max_monthly_payment,
            'current_scenario': {
                'monthly_payment': current_minimum,
                'months_to_payoff': current_scenario['months_to_payoff'],
                'total_interest': current_scenario['total_interest'],
                'total_paid': current_scenario['total_paid']
            },
            'goal_scenario': {
                'monthly_payment': float(required_payment),
                'months_to_payoff': actual_months,
                'total_interest': goal_scenario['total_interest'],
                'total_paid': goal_scenario['total_paid']
            },
            'impact': {
                'interest_saved': interest_saved,
                'months_saved': months_saved,
                'total_saved': interest_saved,
                'percent_interest_saved': (interest_saved / current_scenario['total_interest'] * 100) if current_scenario['total_interest'] > 0 else 0
            },
            'recommendation': self._generate_goal_recommendation(
                required_payment,
                current_minimum,
                target_months,
                actual_months,
                is_feasible,
                interest_saved
            )
        }
    
    def compare_scenarios(self, scenario_a, scenario_b):
        """
        Compare two scenarios side by side
        
        Args:
            scenario_a: First scenario result dictionary
            scenario_b: Second scenario result dictionary
            
        Returns:
            Dictionary with comparison metrics
        """
        comparison = {
            'scenario_type': 'comparison',
            'scenario_a': scenario_a,
            'scenario_b': scenario_b,
            'comparison_metrics': {}
        }
        
        # Extract comparable metrics based on scenario types
        if scenario_a['scenario_type'] == scenario_b['scenario_type']:
            # Same type scenarios - direct comparison
            if scenario_a['scenario_type'] == 'extra_credit_payment':
                comparison['comparison_metrics'] = {
                    'interest_saved_a': scenario_a['savings']['interest_saved'],
                    'interest_saved_b': scenario_b['savings']['interest_saved'],
                    'interest_difference': scenario_b['savings']['interest_saved'] - scenario_a['savings']['interest_saved'],
                    'months_saved_a': scenario_a['savings']['months_saved'],
                    'months_saved_b': scenario_b['savings']['months_saved'],
                    'months_difference': scenario_b['savings']['months_saved'] - scenario_a['savings']['months_saved'],
                    'payment_a': scenario_a['extra_payment_scenario']['monthly_payment'],
                    'payment_b': scenario_b['extra_payment_scenario']['monthly_payment'],
                    'better_scenario': 'B' if scenario_b['savings']['interest_saved'] > scenario_a['savings']['interest_saved'] else 'A',
                    'recommendation': self._generate_comparison_recommendation(
                        scenario_a, scenario_b, 'credit_payment'
                    )
                }
            
            elif scenario_a['scenario_type'] == 'subscription_cancellation':
                comparison['comparison_metrics'] = {
                    'monthly_savings_a': scenario_a['monthly_savings'],
                    'monthly_savings_b': scenario_b['monthly_savings'],
                    'savings_difference': scenario_b['monthly_savings'] - scenario_a['monthly_savings'],
                    'annual_savings_a': scenario_a['annual_savings'],
                    'annual_savings_b': scenario_b['annual_savings'],
                    'better_scenario': 'B' if scenario_b['monthly_savings'] > scenario_a['monthly_savings'] else 'A',
                    'recommendation': self._generate_comparison_recommendation(
                        scenario_a, scenario_b, 'subscription'
                    )
                }
            
            elif scenario_a['scenario_type'] == 'increased_savings':
                comparison['comparison_metrics'] = {
                    'final_balance_a': scenario_a['projected_state']['final_balance'],
                    'final_balance_b': scenario_b['projected_state']['final_balance'],
                    'balance_difference': scenario_b['projected_state']['final_balance'] - scenario_a['projected_state']['final_balance'],
                    'interest_earned_a': scenario_a['projected_state']['interest_earned'],
                    'interest_earned_b': scenario_b['projected_state']['interest_earned'],
                    'better_scenario': 'B' if scenario_b['projected_state']['final_balance'] > scenario_a['projected_state']['final_balance'] else 'A',
                    'recommendation': self._generate_comparison_recommendation(
                        scenario_a, scenario_b, 'savings'
                    )
                }
        else:
            # Different scenario types - compare overall financial impact
            comparison['comparison_metrics'] = {
                'type_a': scenario_a['scenario_type'],
                'type_b': scenario_b['scenario_type'],
                'recommendation': "These scenarios affect different aspects of your finances. Consider your priorities: debt payoff, spending reduction, or savings growth.",
                'summary': self._generate_cross_type_comparison(scenario_a, scenario_b)
            }
        
        return comparison

    # Helper methods

    def _amortize_debt(self, principal, monthly_rate, monthly_payment):
        """
        Calculate debt payoff with amortization

        Returns:
            Dictionary with payoff details
        """
        if monthly_payment <= principal * monthly_rate:
            # Payment doesn't cover interest - will never pay off
            return {
                'months_to_payoff': float('inf'),
                'total_interest': float('inf'),
                'total_paid': float('inf')
            }

        balance = principal
        total_interest = 0
        months = 0
        max_months = 1000  # Safety limit

        while balance > 0.01 and months < max_months:
            interest_charge = balance * monthly_rate
            principal_payment = min(monthly_payment - interest_charge, balance)

            balance -= principal_payment
            total_interest += interest_charge
            months += 1

        return {
            'months_to_payoff': months,
            'total_interest': total_interest,
            'total_paid': principal + total_interest
        }

    def _calculate_months_to_savings_goal(self, current, target, monthly_contribution, monthly_rate):
        """
        Calculate months needed to reach savings goal with compound interest
        """
        if monthly_contribution <= 0:
            return None

        balance = current
        months = 0
        max_months = 1000

        while balance < target and months < max_months:
            balance += monthly_contribution
            balance += balance * monthly_rate
            months += 1

        return months if balance >= target else None

    def _generate_credit_recommendation(self, interest_saved, months_saved):
        """Generate recommendation text for credit payment scenario"""
        if interest_saved > 1000:
            return f"Excellent impact! Paying extra will save you ${interest_saved:,.2f} in interest and get you debt-free {months_saved:.0f} months sooner."
        elif interest_saved > 500:
            return f"Good strategy. You'll save ${interest_saved:,.2f} in interest and pay off your balance {months_saved:.0f} months faster."
        else:
            return f"This will save ${interest_saved:,.2f} and reduce your debt timeline by {months_saved:.0f} months."

    def _generate_subscription_recommendation(self, monthly_savings, subscriptions):
        """Generate recommendation text for subscription cancellation"""
        if monthly_savings > 100:
            return f"Significant savings opportunity! Canceling these {len(subscriptions)} subscriptions frees up ${monthly_savings:,.2f}/month (${monthly_savings * 12:,.2f}/year)."
        else:
            return f"Canceling these subscriptions saves ${monthly_savings:,.2f}/month (${monthly_savings * 12:,.2f}/year)."

    def _generate_savings_recommendation(self, monthly_amount, coverage, target, months_to_target):
        """Generate recommendation text for savings scenario"""
        if coverage >= 6:
            return f"Excellent! At {coverage:.1f} months of coverage, you'll have a robust emergency fund."
        elif coverage >= 3:
            return f"Good progress. You'll reach {coverage:.1f} months of emergency coverage, meeting the recommended 3-6 month target."
        else:
            if months_to_target:
                return f"You'll reach your savings goal in {months_to_target} months at ${monthly_amount:,.2f}/month. Keep building toward 3-6 months of expenses."
            else:
                return f"You'll have {coverage:.1f} months of coverage. Keep building toward the 3-6 month emergency fund target."

    def _generate_alternative_uses(self, monthly_amount):
        """Generate alternative uses for saved money"""
        return [
            f"Emergency fund: Add ${monthly_amount:,.2f}/month to savings",
            f"Debt payoff: Pay down credit cards ${monthly_amount:,.2f} faster",
            f"Investment: Contribute ${monthly_amount:,.2f}/month to retirement",
            f"Annual savings: ${monthly_amount * 12:,.2f}/year for major goals"
        ]

    def _generate_combined_summary(self, results):
        """Generate summary for combined scenarios"""
        summary_parts = []

        for result in results:
            if result['scenario_type'] == 'extra_credit_payment':
                summary_parts.append(
                    f"Save ${result['savings']['interest_saved']:,.2f} in credit card interest"
                )
            elif result['scenario_type'] == 'subscription_cancellation':
                summary_parts.append(
                    f"Free up ${result['monthly_savings']:,.2f}/month from subscriptions"
                )
            elif result['scenario_type'] == 'increased_savings':
                summary_parts.append(
                    f"Grow savings to ${result['projected_state']['final_balance']:,.2f}"
                )

        return summary_parts
    
    def _generate_combined_recommendation(self, net_impact, interest_saved, subscription_savings):
        """Generate recommendation for combined scenarios"""
        if net_impact > 0:
            return f"Great strategy! This plan improves your cash flow by ${net_impact:,.2f}/month, saves ${interest_saved:,.2f} in interest, and frees up ${subscription_savings:,.2f}/year from subscriptions."
        elif net_impact == 0:
            return f"This plan is cash-flow neutral but saves ${interest_saved:,.2f} in interest and frees up ${subscription_savings:,.2f}/year from subscriptions."
        else:
            return f"This plan requires ${abs(net_impact):,.2f}/month additional cash flow but will save ${interest_saved:,.2f} in interest and free up ${subscription_savings:,.2f}/year from subscriptions. Consider phasing in changes gradually."
    
    def _generate_goal_recommendation(self, required_payment, current_minimum, target_months, actual_months, is_feasible, interest_saved):
        """Generate recommendation for goal-based planning"""
        if is_feasible:
            return f"To pay off your debt in {target_months} months, increase your monthly payment from ${current_minimum:,.2f} to ${required_payment:,.2f}. This will save ${interest_saved:,.2f} in interest."
        else:
            return f"To pay off in {target_months} months, you'd need ${required_payment:,.2f}/month (${actual_months:.0f} months at your max of ${required_payment:,.2f}/month). You'll still save ${interest_saved:,.2f} in interest compared to minimum payments."
    
    def _generate_comparison_recommendation(self, scenario_a, scenario_b, scenario_type):
        """Generate recommendation comparing two scenarios"""
        if scenario_type == 'credit_payment':
            if scenario_b['savings']['interest_saved'] > scenario_a['savings']['interest_saved']:
                return f"Scenario B saves ${scenario_b['savings']['interest_saved'] - scenario_a['savings']['interest_saved']:,.2f} more in interest and pays off {scenario_b['savings']['months_saved'] - scenario_a['savings']['months_saved']:.0f} months faster."
            else:
                return f"Scenario A saves ${scenario_a['savings']['interest_saved'] - scenario_b['savings']['interest_saved']:,.2f} more in interest, but requires ${scenario_a['extra_payment_scenario']['monthly_payment'] - scenario_b['extra_payment_scenario']['monthly_payment']:,.2f}/month more."
        elif scenario_type == 'subscription':
            if scenario_b['monthly_savings'] > scenario_a['monthly_savings']:
                return f"Scenario B saves ${scenario_b['monthly_savings'] - scenario_a['monthly_savings']:,.2f} more per month (${(scenario_b['annual_savings'] - scenario_a['annual_savings']):,.2f}/year)."
            else:
                return f"Scenario A saves ${scenario_a['monthly_savings'] - scenario_b['monthly_savings']:,.2f} more per month."
        elif scenario_type == 'savings':
            if scenario_b['projected_state']['final_balance'] > scenario_a['projected_state']['final_balance']:
                return f"Scenario B grows your savings ${scenario_b['projected_state']['final_balance'] - scenario_a['projected_state']['final_balance']:,.2f} more, earning ${scenario_b['projected_state']['interest_earned'] - scenario_a['projected_state']['interest_earned']:,.2f} additional interest."
            else:
                return f"Scenario A grows your savings ${scenario_a['projected_state']['final_balance'] - scenario_b['projected_state']['final_balance']:,.2f} more."
        return "Compare the scenarios to see which better aligns with your financial goals."
    
    def _generate_cross_type_comparison(self, scenario_a, scenario_b):
        """Generate summary for comparing different scenario types"""
        impacts = []
        
        if scenario_a['scenario_type'] == 'extra_credit_payment':
            impacts.append(f"Scenario A: Saves ${scenario_a['savings']['interest_saved']:,.2f} in interest")
        elif scenario_a['scenario_type'] == 'subscription_cancellation':
            impacts.append(f"Scenario A: Saves ${scenario_a['monthly_savings']:,.2f}/month from subscriptions")
        elif scenario_a['scenario_type'] == 'increased_savings':
            impacts.append(f"Scenario A: Grows savings to ${scenario_a['projected_state']['final_balance']:,.2f}")
        
        if scenario_b['scenario_type'] == 'extra_credit_payment':
            impacts.append(f"Scenario B: Saves ${scenario_b['savings']['interest_saved']:,.2f} in interest")
        elif scenario_b['scenario_type'] == 'subscription_cancellation':
            impacts.append(f"Scenario B: Saves ${scenario_b['monthly_savings']:,.2f}/month from subscriptions")
        elif scenario_b['scenario_type'] == 'increased_savings':
            impacts.append(f"Scenario B: Grows savings to ${scenario_b['projected_state']['final_balance']:,.2f}")
        
        return impacts


def run_example_scenarios():
    """Run example what-if scenarios"""
    from ingest.data_generator import generate_synthetic_data
    from features.signal_detection import detect_behavioral_signals
    import json

    # Generate test data
    data = generate_synthetic_data(num_users=10)

    # Find a user with a credit card
    for user_id in data['users']['user_id']:
        user_accounts = data['accounts'][data['accounts']['user_id'] == user_id]
        credit_cards = user_accounts[user_accounts['type'] == 'credit card']

        if not credit_cards.empty:
            # Detect signals
            signals = detect_behavioral_signals(
                user_id,
                data['transactions'],
                data['accounts'],
                data['liabilities']
            )

            # Initialize simulator
            simulator = WhatIfSimulator(signals, user_accounts, data['liabilities'])

            print(f"\n{'='*70}")
            print(f"WHAT-IF SCENARIOS FOR USER: {user_id}")
            print(f"{'='*70}")

            # Scenario 1: Extra credit card payment
            print("\n1. EXTRA CREDIT CARD PAYMENT")
            print("-" * 70)
            credit_result = simulator.simulate_extra_credit_payment(
                credit_cards.iloc[0]['account_id'],
                extra_monthly_payment=200,
                months=12
            )
            print(f"Current balance: ${credit_result['current_balance']:,.2f}")
            print(f"Extra payment: ${credit_result['extra_payment']:,.2f}/month")
            print(f"Interest saved: ${credit_result['savings']['interest_saved']:,.2f}")
            print(f"Months saved: {credit_result['savings']['months_saved']:.0f}")
            print(f"Recommendation: {credit_result['recommendation']}")

            # Scenario 2: Cancel subscriptions
            print("\n2. CANCEL SUBSCRIPTIONS")
            print("-" * 70)
            sub_result = simulator.simulate_subscription_cancellation([
                {'name': 'Netflix', 'amount': 15.99},
                {'name': 'Spotify', 'amount': 10.99},
                {'name': 'Gym', 'amount': 45.00}
            ])
            print(f"Monthly savings: ${sub_result['monthly_savings']:,.2f}")
            print(f"Annual savings: ${sub_result['annual_savings']:,.2f}")
            print(f"Recommendation: {sub_result['recommendation']}")

            # Scenario 3: Increase savings
            print("\n3. INCREASE SAVINGS")
            print("-" * 70)
            savings_result = simulator.simulate_increased_savings(
                monthly_amount=500,
                target_amount=10000,
                months=12
            )
            print(f"Current savings: ${savings_result['current_state']['savings_balance']:,.2f}")
            print(f"After 12 months: ${savings_result['projected_state']['final_balance']:,.2f}")
            print(f"Interest earned: ${savings_result['projected_state']['interest_earned']:,.2f}")
            print(f"Emergency coverage: {savings_result['projected_state']['emergency_fund_months']:.1f} months")
            print(f"Recommendation: {savings_result['recommendation']}")

            break


if __name__ == '__main__':
    run_example_scenarios()
