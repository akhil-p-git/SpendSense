"""
Tests for persona assignment module
"""

import pytest
from personas.persona_assignment import (
    assign_persona,
    get_persona_rationale,
    check_high_utilization,
    check_subscription_heavy
)


@pytest.fixture
def high_utilization_signals():
    """Create signals for high utilization persona"""
    return {
        'credit': {
            'has_credit_card': True,
            'max_utilization': 68.0,
            'has_interest_charges': True,
            'minimum_payment_only': True,
            'is_overdue': False
        },
        'subscriptions': {
            'num_recurring_merchants': 2
        },
        'savings': {
            'savings_growth_rate': 1.0
        },
        'income': {
            'has_payroll': True,
            'median_pay_gap': 30
        }
    }


@pytest.fixture
def subscription_heavy_signals():
    """Create signals for subscription-heavy persona"""
    return {
        'credit': {
            'has_credit_card': True,
            'max_utilization': 25.0
        },
        'subscriptions': {
            'num_recurring_merchants': 5,
            'monthly_recurring_spend': 75.0,
            'subscription_share': 12.0
        },
        'savings': {
            'savings_growth_rate': 1.5
        },
        'income': {
            'has_payroll': True,
            'median_pay_gap': 30
        }
    }


def test_check_high_utilization(high_utilization_signals):
    """Test high utilization persona check"""
    from personas.persona_assignment import check_high_utilization
    result = check_high_utilization(high_utilization_signals)
    assert result == True


def test_check_subscription_heavy(subscription_heavy_signals):
    """Test subscription-heavy persona check"""
    from personas.persona_assignment import check_subscription_heavy
    result = check_subscription_heavy(subscription_heavy_signals)
    assert result == True


def test_assign_persona_high_utilization(high_utilization_signals):
    """Test persona assignment for high utilization user"""
    persona = assign_persona(high_utilization_signals)
    
    assert 'primary_persona' in persona
    assert 'persona_name' in persona
    assert persona['primary_persona'] == 'high_utilization'


def test_assign_persona_subscription_heavy(subscription_heavy_signals):
    """Test persona assignment for subscription-heavy user"""
    persona = assign_persona(subscription_heavy_signals)
    
    assert 'primary_persona' in persona
    assert persona['primary_persona'] == 'subscription_heavy'


def test_get_persona_rationale(high_utilization_signals):
    """Test persona rationale generation"""
    rationale = get_persona_rationale('high_utilization', high_utilization_signals)
    
    assert rationale is not None
    assert len(rationale) > 0
    assert isinstance(rationale, str)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

