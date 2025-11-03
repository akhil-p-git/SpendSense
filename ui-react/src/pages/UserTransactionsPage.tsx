/**
 * User Transactions Page
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TransactionsView } from '@/features/transactions/TransactionsView';
import { useStore } from '@/store/useStore';

export const UserTransactionsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { setCurrentUserId } = useStore();

  React.useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
    }
  }, [userId, setCurrentUserId]);

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <TransactionsView />;
};

