/**
 * ProfileView Component
 * Displays user profile with persona badge and metrics grid
 */

import React from 'react';
import { useProfile } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { PersonaBadge } from '@/components/profile/PersonaBadge';
import { MetricsGrid } from '@/components/profile/MetricsGrid';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Card } from '@/components/common/Card';

export const ProfileView: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: profile, isLoading, error } = useProfile(currentUserId);

  if (!currentUserId) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Card>
          <p className="text-lg">Please select a user to view their profile</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <ErrorMessage 
          message={error instanceof Error ? error.message : 'Failed to load profile'} 
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Card>
          <p className="text-lg">No profile data available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Persona Badge */}
      <PersonaBadge 
        persona={profile.persona} 
        rationale={profile.rationale}
      />

      {/* Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
        <MetricsGrid signals={profile.signals} />
      </div>
    </div>
  );
};
