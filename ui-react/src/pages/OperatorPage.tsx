/**
 * Operator Dashboard Page
 */

import React from 'react';
import { OperatorView } from '@/features/operator';
import { useStore } from '@/store/useStore';

export const OperatorPage: React.FC = () => {
  const { setActiveTab } = useStore();

  React.useEffect(() => {
    setActiveTab('operator');
  }, [setActiveTab]);

  return <OperatorView />;
};

