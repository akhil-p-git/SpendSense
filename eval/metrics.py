"""
Evaluation metrics for SpendSense
Calculates coverage, explainability, latency, and auditability metrics
"""

import pandas as pd
import time
from datetime import datetime
import json


def calculate_coverage(users_df, personas_df, signals_df):
    """
    Calculate coverage: % of users with assigned persona + ≥3 behaviors

    Args:
        users_df: DataFrame with user data
        personas_df: DataFrame with persona assignments
        signals_df: DataFrame with detected signals

    Returns:
        dict: Coverage metrics
    """
    total_users = len(users_df)
    users_with_persona = len(personas_df[personas_df['primary_persona'].notna()])

    # Count users with ≥3 behaviors
    signal_counts = signals_df.groupby('user_id').size()
    users_with_3plus_behaviors = len(signal_counts[signal_counts >= 3])

    # Users with both persona and ≥3 behaviors
    users_with_persona_ids = set(personas_df['user_id'].unique())
    users_with_3plus_ids = set(signal_counts[signal_counts >= 3].index)
    users_fully_covered = len(users_with_persona_ids & users_with_3plus_ids)

    coverage_percent = (users_fully_covered / total_users * 100) if total_users > 0 else 0

    return {
        'total_users': total_users,
        'users_with_persona': users_with_persona,
        'users_with_3plus_behaviors': users_with_3plus_behaviors,
        'users_fully_covered': users_fully_covered,
        'coverage_percent': coverage_percent,
        'target_met': coverage_percent >= 100
    }


def calculate_explainability(recommendations_list):
    """
    Calculate explainability: % of recommendations with rationales

    Args:
        recommendations_list: List of recommendation dicts

    Returns:
        dict: Explainability metrics
    """
    total_recommendations = len(recommendations_list)
    recommendations_with_rationale = sum(
        1 for rec in recommendations_list
        if rec.get('rationale') and len(str(rec.get('rationale', ''))) > 10
    )

    explainability_percent = (
        (recommendations_with_rationale / total_recommendations * 100)
        if total_recommendations > 0 else 0
    )

    return {
        'total_recommendations': total_recommendations,
        'recommendations_with_rationale': recommendations_with_rationale,
        'explainability_percent': explainability_percent,
        'target_met': explainability_percent >= 100
    }


def calculate_latency(timings_list):
    """
    Calculate average latency per user

    Args:
        timings_list: List of dicts with 'user_id' and 'latency_seconds'

    Returns:
        dict: Latency metrics
    """
    if not timings_list:
        return {
            'avg_latency': 0,
            'median_latency': 0,
            'max_latency': 0,
            'min_latency': 0,
            'target_met': False
        }

    latencies = [t['latency_seconds'] for t in timings_list]

    return {
        'avg_latency': sum(latencies) / len(latencies),
        'median_latency': sorted(latencies)[len(latencies) // 2],
        'max_latency': max(latencies),
        'min_latency': min(latencies),
        'target_met': (sum(latencies) / len(latencies)) < 5.0
    }


def calculate_auditability(recommendations_list):
    """
    Calculate auditability: % of recommendations with decision traces

    Args:
        recommendations_list: List of recommendation dicts

    Returns:
        dict: Auditability metrics
    """
    total_recommendations = len(recommendations_list)
    recommendations_with_trace = sum(
        1 for rec in recommendations_list
        if rec.get('decision_trace') or rec.get('data_points')
    )

    auditability_percent = (
        (recommendations_with_trace / total_recommendations * 100)
        if total_recommendations > 0 else 0
    )

    return {
        'total_recommendations': total_recommendations,
        'recommendations_with_trace': recommendations_with_trace,
        'auditability_percent': auditability_percent,
        'target_met': auditability_percent >= 100
    }


def generate_evaluation_report(users_df, personas_df, signals_df, recommendations_list, timings_list):
    """
    Generate comprehensive evaluation report

    Args:
        users_df: DataFrame with user data
        personas_df: DataFrame with persona assignments
        signals_df: DataFrame with detected signals
        recommendations_list: List of recommendation dicts
        timings_list: List of timing dicts

    Returns:
        dict: Complete evaluation report
    """
    coverage = calculate_coverage(users_df, personas_df, signals_df)
    explainability = calculate_explainability(recommendations_list)
    latency = calculate_latency(timings_list)
    auditability = calculate_auditability(recommendations_list)

    # Overall success score
    targets_met = sum([
        coverage['target_met'],
        explainability['target_met'],
        latency['target_met'],
        auditability['target_met']
    ])

    overall_score = (targets_met / 4) * 100

    report = {
        'timestamp': datetime.now().isoformat(),
        'coverage': coverage,
        'explainability': explainability,
        'latency': latency,
        'auditability': auditability,
        'overall_score': overall_score,
        'targets_met': f"{targets_met}/4",
        'summary': {
            'total_users': coverage['total_users'],
            'coverage': f"{coverage['coverage_percent']:.1f}%",
            'explainability': f"{explainability['explainability_percent']:.1f}%",
            'avg_latency': f"{latency['avg_latency']:.2f}s",
            'auditability': f"{auditability['auditability_percent']:.1f}%"
        }
    }

    return report


def save_evaluation_report(report, output_path):
    """
    Save evaluation report to JSON file

    Args:
        report: Evaluation report dict
        output_path: Path to save report
    """
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    print(f"Evaluation report saved to {output_path}")


if __name__ == '__main__':
    # Example evaluation
    test_users = pd.DataFrame({
        'user_id': [f'user_{i:04d}' for i in range(10)]
    })

    test_personas = pd.DataFrame({
        'user_id': [f'user_{i:04d}' for i in range(8)],
        'primary_persona': ['high_utilization'] * 8
    })

    test_signals = pd.DataFrame({
        'user_id': [f'user_{i:04d}' for i in range(10)],
        'signal_type': ['credit'] * 10
    })

    test_recommendations = [
        {'rationale': 'Test rationale here', 'decision_trace': ['signal1', 'signal2']},
        {'rationale': 'Another rationale', 'decision_trace': ['signal3']},
        {'rationale': ''}  # Missing rationale
    ]

    test_timings = [
        {'user_id': f'user_{i:04d}', 'latency_seconds': 2.5 + i * 0.1}
        for i in range(10)
    ]

    report = generate_evaluation_report(
        test_users, test_personas, test_signals,
        test_recommendations, test_timings
    )

    print(json.dumps(report, indent=2, default=str))

