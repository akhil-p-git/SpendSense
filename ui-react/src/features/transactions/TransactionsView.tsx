/**
 * TransactionsView Component
 * Main view for displaying transactions and spending analytics
 */

import React from 'react';
import { useTransactions } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { TransactionsTab } from '@/components/transactions/TransactionsTab';
import { SpendingChart } from '@/components/transactions/SpendingChart';

export const TransactionsView: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: transactionsData } = useTransactions(currentUserId);

  const transactions = transactionsData?.transactions || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
      
      {/* Spending Chart */}
      <SpendingChart transactions={transactions} />
      
      {/* Transactions Table */}
      <TransactionsTab />
    </div>
  );
};
