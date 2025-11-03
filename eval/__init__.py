"""
Evaluation module for SpendSense
Tracks metrics, generates reports, and measures system performance
"""

from eval.metrics import (
    calculate_coverage,
    calculate_explainability,
    calculate_latency,
    generate_evaluation_report
)

__all__ = [
    'calculate_coverage',
    'calculate_explainability',
    'calculate_latency',
    'generate_evaluation_report'
]

