/**
 * RecommendationsView Component
 * Displays personalized recommendations with education content and partner offers
 */

import React from 'react';
import { useRecommendations, useTrackRecommendationAcceptance, useProfile } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Card } from '@/components/common/Card';

export const RecommendationsView: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: recommendations, isLoading, error } = useRecommendations(currentUserId);
  const { data: profile } = useProfile(currentUserId);
  const trackAcceptance = useTrackRecommendationAcceptance();

  const handleTrackClick = (recommendationId: string, type: string) => {
    if (currentUserId) {
      trackAcceptance.mutate({
        userId: currentUserId,
        recommendationId,
        type,
      });
    }
  };

  if (!currentUserId) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Card>
          <p className="text-lg">Please select a user to view recommendations</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's a consent error
    const errorMessage = error instanceof Error ? error.message : 'Failed to load recommendations';
    const isConsentError = errorMessage.toLowerCase().includes('consent') || 
                          errorMessage.toLowerCase().includes('403');

    return (
      <div className="py-6">
        <ErrorMessage message={errorMessage} />
        {isConsentError && (
          <Card className="mt-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Consent Required:</strong> This user has not provided consent for data processing. 
              Please update their consent status to view recommendations.
            </p>
          </Card>
        )}
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Card>
          <p className="text-lg">No recommendations available</p>
        </Card>
      </div>
    );
  }

  const educationItems = recommendations.education || [];
  const partnerOffers = recommendations.offers || [];

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      {recommendations.disclaimer && (
        <Card className="bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            {recommendations.disclaimer}
          </p>
        </Card>
      )}

      {/* Education Content */}
      {educationItems.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Educational Content</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {educationItems.length} {educationItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {educationItems.map((rec, index) => (
              <RecommendationCard
                key={rec.id || `edu-${index}`}
                recommendation={rec}
                onTrackClick={handleTrackClick}
                userId={currentUserId}
                userSignals={profile?.signals}
              />
            ))}
          </div>
        </div>
      )}

      {/* Partner Offers */}
      {partnerOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Partner Offers</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              {partnerOffers.length} {partnerOffers.length === 1 ? 'offer' : 'offers'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerOffers.map((rec, index) => (
              <RecommendationCard
                key={rec.id || `offer-${index}`}
                recommendation={rec}
                onTrackClick={handleTrackClick}
                userId={currentUserId}
                userSignals={profile?.signals}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {educationItems.length === 0 && partnerOffers.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No recommendations available at this time.</p>
            <p className="text-sm text-gray-500">
              Recommendations are generated based on your financial profile and behavioral signals.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
