/**
 * User Recommendations Page
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { RecommendationsView } from '@/features/recommendations/RecommendationsView';
import { useStore } from '@/store/useStore';

export const UserRecommendationsPage: React.FC = () => {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personalized Recommendations</h2>
      <RecommendationsView />
    </div>
  );
};

