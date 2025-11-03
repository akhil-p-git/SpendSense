/**
 * MetricsGrid Component
 * Mint-style grid displaying key financial metrics
 */

import React from 'react';
import type { BehavioralSignal } from '@/types';
import { Card } from '@/components/common/Card';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface MetricsGridProps {
  signals: BehavioralSignal;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ signals }) => {
  // Extract metrics from signals
  const creditUtilization = signals.credit?.max_utilization || 0;
  const totalCreditBalance = signals.credit?.total_credit_balance || 0;
  const savingsBalance = signals.savings?.current_savings_balance || 0;
  const monthlySavingsInflow = signals.savings?.monthly_savings_inflow || 0;
  const emergencyFundMonths = signals.savings?.emergency_fund_coverage || 0;
  const numSubscriptions = signals.subscriptions?.num_recurring_merchants || 0;
  const monthlySubscriptionSpend = signals.subscriptions?.monthly_recurring_spend || 0;
  // Income signals - may vary by structure
  const monthlyIncome = signals.income?.monthly_income || signals.income?.avg_monthly_income || 0;
  const incomeVariability = signals.income?.coefficient_of_variation || signals.income?.pay_variability || 0;

  // Calculate savings rate if we have income and savings
  const savingsRate = monthlyIncome > 0 
    ? ((monthlySavingsInflow / monthlyIncome) * 100).toFixed(1)
    : '0.0';

  const metrics = [
    {
      label: 'Credit Utilization',
      value: formatPercentage(creditUtilization),
      subtitle: formatCurrency(totalCreditBalance),
      color: creditUtilization > 70 ? 'text-danger-600' : creditUtilization > 40 ? 'text-warning-600' : 'text-success-600',
      icon: '💳',
    },
    {
      label: 'Savings Balance',
      value: formatCurrency(savingsBalance),
      subtitle: `${emergencyFundMonths.toFixed(1)} months coverage`,
      color: 'text-success-600',
      icon: '💰',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      subtitle: `${formatCurrency(monthlySavingsInflow)}/month`,
      color: 'text-success-600',
      icon: '📈',
    },
    {
      label: 'Active Subscriptions',
      value: numSubscriptions.toString(),
      subtitle: formatCurrency(monthlySubscriptionSpend) + '/month',
      color: 'text-purple-600',
      icon: '📱',
    },
    {
      label: 'Monthly Income',
      value: monthlyIncome > 0 ? formatCurrency(monthlyIncome) : 'N/A',
      subtitle: incomeVariability > 0 
        ? (incomeVariability < 0.2 ? 'Stable' : incomeVariability < 0.5 ? 'Moderate' : 'Variable')
        : 'Not tracked',
      color: 'text-primary-600',
      icon: '💵',
    },
    {
      label: 'Emergency Fund',
      value: `${emergencyFundMonths.toFixed(1)} months`,
      subtitle: emergencyFundMonths >= 6 ? 'Well funded' : emergencyFundMonths >= 3 ? 'Adequate' : 'Needs building',
      color: emergencyFundMonths >= 6 ? 'text-success-600' : emergencyFundMonths >= 3 ? 'text-warning-600' : 'text-danger-600',
      icon: '🛡️',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{metric.icon}</span>
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              </div>
              <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                {metric.value}
              </div>
              {metric.subtitle && (
                <div className="text-sm text-gray-500">{metric.subtitle}</div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

