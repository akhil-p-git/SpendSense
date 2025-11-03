/**
 * TransactionsTab Component
 * Displays transactions in a sortable table with virtual scrolling
 */

import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { TransactionRow } from './TransactionRow';

type SortField = 'date' | 'amount';
type SortDirection = 'asc' | 'desc';

export const TransactionsTab: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: transactionsData, isLoading, error } = useTransactions(currentUserId);
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get last 30 transactions
  const transactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];
    return transactionsData.transactions.slice(0, 30);
  }, [transactionsData]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [transactions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (!currentUserId) {
    return (
      <Card>
        <p className="text-gray-500">Please select a user to view transactions.</p>
      </Card>
    );
  }

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
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load transactions'} />
      </Card>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">No transactions found</p>
      </Card>
    );
  }


  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <span className="text-sm text-gray-500">Showing {sortedTransactions.length} transactions</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-2">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Channel
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => (
              <TransactionRow key={transaction.transaction_id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

