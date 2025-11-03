/**
 * PersonaDistributionCard Component
 * Displays persona distribution as a pie chart
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { usePersonaDistribution } from '@/hooks/useApi';
import { formatPercentage } from '@/utils/format';

// Helper to format percentage from decimal to percentage string
const formatPercent = (value: number): string => {
  return formatPercentage(value * 100);
};

// Color palette for personas
const PERSONA_COLORS: Record<string, string> = {
  'High Utilization': '#EF4444', // red
  'Variable Income Budgeter': '#F59E0B', // yellow/orange
  'Subscription-Heavy': '#8B5CF6', // purple
  'Emergency Fund Starter': '#F97316', // orange
  'Savings Builder': '#10B981', // green
  'Debt Optimizer': '#3B82F6', // blue
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-semibold">{formatPercent(data.percentage)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const PersonaDistributionCard: React.FC = () => {
  const { data, isLoading, error } = usePersonaDistribution();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load persona distribution'} />
      </Card>
    );
  }

  if (!data || !data.distribution || Object.keys(data.distribution).length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Distribution</h3>
        <p className="text-gray-500 text-center py-8">No persona data available</p>
      </Card>
    );
  }

  const chartData = Object.entries(data.distribution).map(([persona, stats]: [string, any]) => ({
    name: persona,
    count: stats.count,
    percentage: stats.percentage,
    value: stats.count,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Distribution</h3>
      
      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const percentage = entry.percentage || 0;
                return `${entry.name} (${percentage.toFixed(0)}%)`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: any) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={PERSONA_COLORS[entry.name] || '#9CA3AF'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Persona Summary List */}
      <div className="mt-6 space-y-2">
        {chartData.map((item: any) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: PERSONA_COLORS[item.name] || '#9CA3AF' }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{item.count} users</span>
              <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                {formatPercent(item.percentage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

