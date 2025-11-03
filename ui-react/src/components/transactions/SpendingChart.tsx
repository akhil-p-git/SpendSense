/**
 * SpendingChart Component
 * Displays spending by category using a pie chart
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/common/Card';
import { formatCurrency } from '@/utils/format';
import type { Transaction } from '@/types';

interface SpendingChartProps {
  transactions: Transaction[];
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  [key: string]: string | number;
}

// Color palette for chart
const COLORS = [
  '#3B82F6', // blue-500
  '#8B5CF6', // purple-500
  '#F59E0B', // orange-500
  '#10B981', // green-500
  '#EC4899', // pink-500
  '#EF4444', // red-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Amount: <span className="font-semibold">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingChart: React.FC<SpendingChartProps> = ({ transactions }) => {
  const categoryData = useMemo<CategoryData[]>(() => {
    // Only include expenses (negative amounts)
    const expenses = transactions.filter(t => t.amount < 0);
    
    // Group by category
    const categoryMap = new Map<string, number>();
    expenses.forEach(transaction => {
      const category = transaction.category_primary || 'Other';
      const amount = Math.abs(transaction.amount);
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
    });

    // Calculate total
    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

    // Convert to array and calculate percentages
    const data: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories

    return data;
  }, [transactions]);

  if (categoryData.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <p className="text-gray-500 text-center py-8">No spending data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
      <div className="w-full" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const percentage = entry.percentage || 0;
                return `${entry.name} (${percentage.toFixed(0)}%)`;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      
      {/* Category Summary List */}
      <div className="mt-6 space-y-2">
        {categoryData.map((category, index) => (
          <div key={category.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700">{category.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</span>
              <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                {formatCurrency(category.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

