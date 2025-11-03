/**
 * RecommendationTrackingCard Component
 * Displays recommendation acceptance tracking and breakdowns
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useRecommendationTracking } from '@/hooks/useApi';
import { formatPercentage } from '@/utils/format';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, color = 'bg-primary-600' }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {value} / {max} ({formatPercentage(percentage)})
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export const RecommendationTrackingCard: React.FC = () => {
  const { data, isLoading, error } = useRecommendationTracking();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load recommendation tracking'} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Tracking</h3>
        <p className="text-gray-500 text-center py-8">No tracking data available</p>
      </Card>
    );
  }

  const overallAcceptanceRate = data.acceptance_rate || 0;
  const totalShown = data.total_views || 0;
  const totalAccepted = data.total_acceptances || 0;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Tracking</h3>
      
      <div className="space-y-6">
        {/* Overall Acceptance Rate */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Acceptance Rate</span>
            <span className="text-2xl font-bold text-primary-600">
              {formatPercentage(overallAcceptanceRate * 100)}
            </span>
          </div>
          <ProgressBar
            label="Accepted"
            value={totalAccepted}
            max={totalShown || 1}
            color="bg-success-600"
          />
        </div>

        {/* Breakdown by Type */}
        {data.by_type && Object.keys(data.by_type).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">By Recommendation Type</h4>
            <div className="space-y-3">
              {Object.entries(data.by_type).map(([type, stats]: [string, any]) => (
                <ProgressBar
                  key={type}
                  label={type || 'Unknown'}
                  value={stats.acceptances || 0}
                  max={stats.views || 1}
                  color="bg-blue-600"
                />
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Persona */}
        {data.by_persona && Object.keys(data.by_persona).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">By Persona</h4>
            <div className="space-y-3">
              {Object.entries(data.by_persona).map(([persona, stats]: [string, any]) => (
                <ProgressBar
                  key={persona}
                  label={persona || 'Unknown'}
                  value={stats.acceptances || 0}
                  max={stats.views || 1}
                  color="bg-purple-600"
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Shown</div>
            <div className="text-lg font-semibold text-gray-900">{totalShown}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Accepted</div>
            <div className="text-lg font-semibold text-success-600">{totalAccepted}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

