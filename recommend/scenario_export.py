"""
Scenario report export functionality
Supports PDF and JSON exports for what-if scenarios
"""

import json
from datetime import datetime
from io import BytesIO

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def export_scenario_json(scenario_result, user_id, filename=None):
    """
    Export scenario result as JSON
    
    Args:
        scenario_result: Scenario result dictionary
        user_id: User ID
        filename: Optional filename (if None, returns as string)
        
    Returns:
        JSON string or writes to file
    """
    export_data = {
        'user_id': user_id,
        'exported_at': datetime.now().isoformat(),
        'scenario': scenario_result
    }
    
    json_str = json.dumps(export_data, indent=2, default=str)
    
    if filename:
        with open(filename, 'w') as f:
            f.write(json_str)
        return filename
    else:
        return json_str


def export_scenario_pdf(scenario_result, user_id):
    """
    Export scenario result as PDF
    
    Args:
        scenario_result: Scenario result dictionary
        user_id: User ID
        
    Returns:
        BytesIO buffer with PDF content
    """
    if not REPORTLAB_AVAILABLE:
        raise ImportError("reportlab not installed. Install with: pip install reportlab")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'ScenarioTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=20
    )
    story.append(Paragraph("What-If Scenario Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Paragraph(f"User: {user_id}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Scenario type
    scenario_type = scenario_result.get('scenario_type', 'unknown')
    story.append(Paragraph(f"<b>Scenario Type:</b> {scenario_type.replace('_', ' ').title()}", styles['Heading2']))
    story.append(Spacer(1, 0.2*inch))
    
    # Generate content based on scenario type
    if scenario_type == 'extra_credit_payment':
        _add_credit_payment_content(story, scenario_result, styles)
    elif scenario_type == 'subscription_cancellation':
        _add_subscription_content(story, scenario_result, styles)
    elif scenario_type == 'increased_savings':
        _add_savings_content(story, scenario_result, styles)
    elif scenario_type == 'combined':
        _add_combined_content(story, scenario_result, styles)
    elif scenario_type == 'goal_based_payment':
        _add_goal_based_content(story, scenario_result, styles)
    elif scenario_type == 'comparison':
        _add_comparison_content(story, scenario_result, styles)
    else:
        story.append(Paragraph("Scenario details:", styles['Heading3']))
        story.append(Paragraph(json.dumps(scenario_result, indent=2, default=str), styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def _add_credit_payment_content(story, result, styles):
    """Add credit payment scenario content to PDF"""
    story.append(Paragraph("<b>Current Scenario</b>", styles['Heading3']))
    current = result.get('current_scenario', {})
    current_data = [
        ['Metric', 'Value'],
        ['Current Balance', f"${result.get('current_balance', 0):,.2f}"],
        ['APR', f"{result.get('apr', 0):.2f}%"],
        ['Monthly Payment', f"${current.get('monthly_payment', 0):,.2f}"],
        ['Months to Payoff', f"{current.get('months_to_payoff', 0):.0f}"],
        ['Total Interest', f"${current.get('total_interest', 0):,.2f}"],
    ]
    table = Table(current_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("<b>With Extra Payment</b>", styles['Heading3']))
    extra = result.get('extra_payment_scenario', {})
    savings = result.get('savings', {})
    extra_data = [
        ['Metric', 'Value'],
        ['New Monthly Payment', f"${extra.get('monthly_payment', 0):,.2f}"],
        ['Extra Payment', f"${result.get('extra_payment', 0):,.2f}"],
        ['New Months to Payoff', f"{extra.get('months_to_payoff', 0):.0f}"],
        ['Interest Saved', f"${savings.get('interest_saved', 0):,.2f}"],
        ['Months Saved', f"{savings.get('months_saved', 0):.0f}"],
    ]
    table = Table(extra_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    if result.get('recommendation'):
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"<b>Recommendation:</b> {result['recommendation']}", styles['Normal']))


def _add_subscription_content(story, result, styles):
    """Add subscription cancellation scenario content to PDF"""
    story.append(Paragraph("<b>Subscription Cancellation Impact</b>", styles['Heading3']))
    
    data = [
        ['Metric', 'Value'],
        ['Subscriptions Canceled', f"{len(result.get('subscriptions_canceled', []))}"],
        ['Monthly Savings', f"${result.get('monthly_savings', 0):,.2f}"],
        ['Annual Savings', f"${result.get('annual_savings', 0):,.2f}"],
        ['Current Subscription Spend', f"${result.get('current_subscription_spend', 0):,.2f}"],
        ['New Subscription Spend', f"${result.get('new_subscription_spend', 0):,.2f}"],
        ['Percent Reduction', f"{result.get('percent_reduction', 0):.1f}%"],
    ]
    table = Table(data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    if result.get('recommendation'):
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"<b>Recommendation:</b> {result['recommendation']}", styles['Normal']))


def _add_savings_content(story, result, styles):
    """Add savings scenario content to PDF"""
    story.append(Paragraph("<b>Savings Growth Projection</b>", styles['Heading3']))
    
    current = result.get('current_state', {})
    projected = result.get('projected_state', {})
    growth = result.get('growth', {})
    
    data = [
        ['Metric', 'Current', 'Projected'],
        ['Savings Balance', f"${current.get('savings_balance', 0):,.2f}", f"${projected.get('final_balance', 0):,.2f}"],
        ['Monthly Contribution', f"${result.get('monthly_contribution', 0):,.2f}", f"${result.get('monthly_contribution', 0):,.2f}"],
        ['Emergency Fund Coverage', f"{current.get('emergency_fund_months', 0):.1f} months", f"{projected.get('emergency_fund_months', 0):.1f} months"],
        ['Interest Earned', '-', f"${projected.get('interest_earned', 0):,.2f}"],
        ['Balance Growth', '-', f"{growth.get('percent_growth', 0):.1f}%"],
    ]
    table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    if result.get('recommendation'):
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"<b>Recommendation:</b> {result['recommendation']}", styles['Normal']))


def _add_combined_content(story, result, styles):
    """Add combined scenario content to PDF"""
    story.append(Paragraph("<b>Combined Scenario Summary</b>", styles['Heading3']))
    
    summary_data = [
        ['Metric', 'Value'],
        ['Individual Scenarios', f"{len(result.get('individual_scenarios', []))}"],
        ['Monthly Cash Flow Impact', f"${result.get('monthly_cash_flow_impact', 0):,.2f}"],
        ['Annual Cash Flow Impact', f"${result.get('annual_cash_flow_impact', 0):,.2f}"],
        ['Total Interest Saved', f"${result.get('total_interest_saved', 0):,.2f}"],
        ['Total Subscription Savings', f"${result.get('total_subscription_savings', 0):,.2f}"],
    ]
    table = Table(summary_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    if result.get('summary'):
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph("<b>Summary:</b>", styles['Heading4']))
        for item in result['summary']:
            story.append(Paragraph(f"• {item}", styles['Normal']))


def _add_goal_based_content(story, result, styles):
    """Add goal-based planning content to PDF"""
    story.append(Paragraph("<b>Goal-Based Debt Payoff Plan</b>", styles['Heading3']))
    
    data = [
        ['Metric', 'Value'],
        ['Current Balance', f"${result.get('current_balance', 0):,.2f}"],
        ['Target Months', f"{result.get('target_months', 0)}"],
        ['Required Monthly Payment', f"${result.get('required_monthly_payment', 0):,.2f}"],
        ['Current Minimum Payment', f"${result.get('current_minimum_payment', 0):,.2f}"],
        ['Payment Increase', f"${result.get('payment_increase', 0):,.2f}"],
        ['Is Feasible', 'Yes' if result.get('is_feasible') else 'No'],
    ]
    table = Table(data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    impact = result.get('impact', {})
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>Impact</b>", styles['Heading4']))
    impact_data = [
        ['Interest Saved', f"${impact.get('interest_saved', 0):,.2f}"],
        ['Months Saved', f"{impact.get('months_saved', 0):.0f}"],
        ['Total Saved', f"${impact.get('total_saved', 0):,.2f}"],
    ]
    table = Table(impact_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)


def _add_comparison_content(story, result, styles):
    """Add comparison scenario content to PDF"""
    story.append(Paragraph("<b>Scenario Comparison</b>", styles['Heading3']))
    
    metrics = result.get('comparison_metrics', {})
    scenario_a = result.get('scenario_a', {})
    scenario_b = result.get('scenario_b', {})
    
    story.append(Paragraph(f"<b>Scenario A:</b> {scenario_a.get('scenario_type', 'Unknown')}", styles['Heading4']))
    story.append(Paragraph(f"<b>Scenario B:</b> {scenario_b.get('scenario_type', 'Unknown')}", styles['Heading4']))
    
    if metrics.get('better_scenario'):
        story.append(Paragraph(f"<b>Better Scenario:</b> {metrics['better_scenario']}", styles['Normal']))
    
    if metrics.get('recommendation'):
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"<b>Recommendation:</b> {metrics['recommendation']}", styles['Normal']))

