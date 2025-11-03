/**
 * Home Page
 * Redirects to user selection or first user's recommendations
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUsers } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card } from '@/components/common/Card';

export const HomePage: React.FC = () => {
  const { data: usersData, isLoading } = useUsers();
  const { currentUserId } = useStore();

  // If user is already selected, redirect to their recommendations
  if (currentUserId) {
    return <Navigate to={`/users/${currentUserId}/recommendations`} replace />;
  }

  // If users are loaded and we have a first user, redirect to them
  if (usersData?.users && usersData.users.length > 0 && !currentUserId) {
    return <Navigate to={`/users/${usersData.users[0].user_id}/recommendations`} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SpendSense</h2>
          <p className="text-gray-600 text-lg mb-6">
            Select a user from the dropdown above to view their personalized financial recommendations.
          </p>
          {usersData?.users && usersData.users.length === 0 && (
            <p className="text-gray-500">No users available. Please check the backend connection.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

