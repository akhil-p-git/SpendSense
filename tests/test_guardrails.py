"""
Tests for guardrails module
"""

import pytest
import pandas as pd
from guardrails.consent import check_consent, update_consent_status
from guardrails.eligibility import check_eligibility, filter_ineligible_offers
from guardrails.tone import validate_tone, sanitize_recommendation_text


@pytest.fixture
def sample_users():
    """Create sample user data"""
    return pd.DataFrame({
        'user_id': ['user_001', 'user_002'],
        'consent': [True, False]
    })


def test_check_consent(sample_users):
    """Test consent checking"""
    assert check_consent('user_001', sample_users) == True
    assert check_consent('user_002', sample_users) == False
    assert check_consent('user_003', sample_users) == False


def test_update_consent_status(sample_users):
    """Test consent status update"""
    result = update_consent_status('user_002', True, sample_users)
    assert result == True
    assert check_consent('user_002', sample_users) == True


def test_check_eligibility():
    """Test eligibility checking"""
    signals = {
        'credit': {
            'has_credit_card': True,
            'max_utilization': 68.0
        },
        'subscriptions': {
            'num_recurring_merchants': 5
        }
    }
    
    accounts = pd.DataFrame({
        'account_id': ['acc_001'],
        'type': ['checking']
    })
    
    # Test balance transfer card eligibility
    is_eligible, reason = check_eligibility('user_001', 'balance_transfer_card', signals, accounts)
    assert isinstance(is_eligible, bool)
    assert isinstance(reason, str)


def test_filter_ineligible_offers():
    """Test filtering ineligible offers"""
    recommendations = [
        {'type': 'education', 'title': 'Article'},
        {'type': 'partner_offer', 'product_type': 'balance_transfer_card'}
    ]
    
    signals = {
        'credit': {
            'has_credit_card': True,
            'max_utilization': 95.0  # Too high
        }
    }
    
    accounts = pd.DataFrame({'account_id': ['acc_001'], 'type': ['checking']})
    
    filtered = filter_ineligible_offers(recommendations, 'user_001', signals, accounts)
    # Education content should always pass
    assert len([r for r in filtered if r['type'] == 'education']) == 1


def test_validate_tone():
    """Test tone validation"""
    # Bad tone
    is_valid, violations, _ = validate_tone("You should stop overspending on bad habits")
    assert is_valid == False
    assert len(violations) > 0
    
    # Good tone
    is_valid, violations, _ = validate_tone("You could optimize your spending patterns")
    assert is_valid == True


def test_sanitize_recommendation_text():
    """Test text sanitization"""
    text = "You should stop overspending"
    sanitized = sanitize_recommendation_text(text)
    
    assert "should" not in sanitized.lower()
    assert "overspending" not in sanitized.lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

