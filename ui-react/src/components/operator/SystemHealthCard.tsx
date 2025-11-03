/**
 * SystemHealthCard Component
 * Displays system health metrics
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useSystemHealth } from '@/hooks/useApi';
import { formatPercentage } from '@/utils/format';

interface MetricItemProps {
  label: string;
  value: string | number;
  target?: string;
  meetsTarget?: boolean;
  suffix?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  target,
  meetsTarget,
  suffix = '',
}) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{label}</span>
        {meetsTarget !== undefined && (
          <span className={meetsTarget ? 'text-success-600' : 'text-danger-600'}>
            {meetsTarget ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        )}
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-900">
          {value}
          {suffix}
        </span>
        {target && (
          <span className="text-xs text-gray-500 ml-2">(target: {target})</span>
        )}
      </div>
    </div>
  );
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export const SystemHealthCard: React.FC = () => {
  const { data, isLoading, error } = useSystemHealth();

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
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load system health'} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <p className="text-gray-500 text-center py-8">No health data available</p>
      </Card>
    );
  }

  const avgLatencySeconds = data.latency?.avg_seconds || 0;
  const avgLatencyMs = avgLatencySeconds * 1000;
  const latencyTarget = 5000; // 5 seconds
  const meetsLatencyTarget = avgLatencyMs < latencyTarget;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
      
      <div className="space-y-1">
        <MetricItem
          label="Uptime"
          value={formatUptime(data.uptime_seconds || 0)}
          meetsTarget={true}
        />
        <MetricItem
          label="Average Latency"
          value={`${avgLatencySeconds.toFixed(2)}s`}
          target="< 5s"
          meetsTarget={meetsLatencyTarget}
        />
        <MetricItem
          label="Total API Calls"
          value={data.api_calls?.total || 0}
          suffix=""
        />
        <MetricItem
          label="User Consent Rate"
          value={formatPercentage((data.users?.consent_rate_percent || 0) / 100 * 100)}
          meetsTarget={(data.users?.consent_rate_percent || 0) >= 80}
        />
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">System Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              meetsLatencyTarget && (data.users?.consent_rate_percent || 0) >= 80
                ? 'bg-success-100 text-success-800'
                : 'bg-warning-100 text-warning-800'
            }`}
          >
            {meetsLatencyTarget && (data.users?.consent_rate_percent || 0) >= 80
              ? 'Healthy'
              : 'Needs Attention'}
          </span>
        </div>
      </div>
    </Card>
  );
};

