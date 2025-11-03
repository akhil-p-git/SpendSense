/**
 * User What-If Simulator Page
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { WhatIfView } from '@/features/whatif/WhatIfView';
import { useStore } from '@/store/useStore';

export const UserWhatIfPage: React.FC = () => {
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">What-If Scenario Simulator</h2>
      <WhatIfView />
    </div>
  );
};

