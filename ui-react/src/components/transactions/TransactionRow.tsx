/**
 * TransactionRow Component
 * Displays a single transaction in a table row
 */

import React from 'react';
import { formatCurrency } from '@/utils/format';
import type { Transaction } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
}

// Category color mapping
const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    'Food & Dining': 'bg-blue-100 text-blue-800',
    'Shopping': 'bg-purple-100 text-purple-800',
    'Bills & Utilities': 'bg-orange-100 text-orange-800',
    'Transportation': 'bg-green-100 text-green-800',
    'Entertainment': 'bg-pink-100 text-pink-800',
    'Income': 'bg-success-100 text-success-800',
    'Transfer': 'bg-gray-100 text-gray-800',
    'Other': 'bg-gray-100 text-gray-800',
  };
  return categoryColors[category] || categoryColors['Other'];
};

// Format date to "Nov 3, 2025" format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const isIncome = transaction.amount > 0;
  const amountColor = isIncome ? 'text-success-600' : 'text-gray-900';

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {transaction.merchant_name || 'Unknown'}
      </td>
      <td className={`px-4 py-3 text-sm font-semibold ${amountColor}`}>
        {formatCurrency(Math.abs(transaction.amount))}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category_primary || 'Other')}`}>
          {transaction.category_primary || 'Other'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {transaction.payment_channel || 'N/A'}
      </td>
    </tr>
  );
};

