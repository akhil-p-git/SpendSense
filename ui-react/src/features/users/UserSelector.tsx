/**
 * User Selector Component
 * Fetches users, displays dropdown, stores in Zustand, with refresh button
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';

export const UserSelector: React.FC = () => {
  const { currentUserId, setCurrentUserId, setCurrentUser } = useStore();
  const { data: usersData, isLoading, refetch } = useUsers();
  const navigate = useNavigate();

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId);
    const user = usersData?.users.find((u) => u.user_id === userId);
    setCurrentUser(user || null);
    
    // Navigate to recommendations for the selected user
    if (userId) {
      navigate(`/users/${userId}/recommendations`);
    } else {
      navigate('/');
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <label htmlFor="user-select" className="text-sm font-semibold sm:whitespace-nowrap">
        Select User:
      </label>
      
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm">Loading users...</span>
        </div>
      ) : (
        <>
          <select
            id="user-select"
            value={currentUserId || ''}
            onChange={(e) => handleUserChange(e.target.value)}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-white focus:ring-opacity-50 min-w-[200px] sm:min-w-[250px]"
          >
            <option value="">-- Select a user --</option>
            {usersData?.users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name} ({user.user_id})
              </option>
            ))}
          </select>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            className="whitespace-nowrap bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30 text-white"
          >
            Refresh
          </Button>
        </>
      )}
    </div>
  );
};
