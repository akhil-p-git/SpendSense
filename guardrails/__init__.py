"""
Guardrails module for SpendSense
Handles consent management, eligibility checks, and tone validation
"""

from guardrails.consent import check_consent, update_consent_status
from guardrails.eligibility import check_eligibility, filter_ineligible_offers
from guardrails.tone import validate_tone, sanitize_recommendation_text

__all__ = [
    'check_consent',
    'update_consent_status',
    'check_eligibility',
    'filter_ineligible_offers',
    'validate_tone',
    'sanitize_recommendation_text'
]

