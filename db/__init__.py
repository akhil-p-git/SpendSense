"""
Database package for SpendSense
"""

from .database import init_db, get_db_connection
from .models import (
    User, Account, Transaction, Liability,
    Recommendation, RecommendationView, RecommendationAcceptance,
    UserSession, PersonaAssignment, BehavioralSignal
)

__all__ = [
    'init_db',
    'get_db_connection',
    'User',
    'Account',
    'Transaction',
    'Liability',
    'Recommendation',
    'RecommendationView',
    'RecommendationAcceptance',
    'UserSession',
    'PersonaAssignment',
    'BehavioralSignal'
]

