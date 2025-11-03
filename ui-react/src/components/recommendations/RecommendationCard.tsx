/**
 * RecommendationCard Component
 * Displays a single recommendation with title, description, rationale, and CTA
 */

import React from 'react';
import type { Recommendation } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onTrackClick?: (recommendationId: string, type: string) => void;
  userId?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onTrackClick,
  userId,
}) => {
  const handleClick = () => {
    if (onTrackClick && userId) {
      const recommendationId = recommendation.id || recommendation.title;
      onTrackClick(recommendationId, recommendation.type);
    }
    
    if (recommendation.url) {
      window.open(recommendation.url, '_blank', 'noopener,noreferrer');
    }
  };

  const isEducation = recommendation.type === 'education';
  const badgeColor = isEducation 
    ? 'bg-blue-100 text-blue-800 border-blue-300' 
    : 'bg-purple-100 text-purple-800 border-purple-300';
  const badgeText = isEducation ? 'EDUCATION' : 'PARTNER OFFER';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded border ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {recommendation.title}
        </h4>

        {/* Description */}
        {recommendation.description && (
          <p className="text-gray-600 mb-3 leading-relaxed">
            {recommendation.description}
          </p>
        )}

        {/* Rationale */}
        {recommendation.rationale && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              <strong className="text-gray-900">Because:</strong>{' '}
              {recommendation.rationale}
            </p>
          </div>
        )}

        {/* CTA Button */}
        {recommendation.url && (
          <div className="flex items-center justify-between mt-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={handleClick}
              className="flex-1 sm:flex-none"
            >
              Learn More
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            This is educational content, not financial advice.
          </p>
        </div>
      </div>
    </Card>
  );
};

