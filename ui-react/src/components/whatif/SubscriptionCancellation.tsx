/**
 * SubscriptionCancellation Component
 * Simulates canceling subscriptions
 */

import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { useProfile } from '@/hooks/useApi';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/format';

interface Subscription {
  name: string;
  amount: number;
}

export const SubscriptionCancellation: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: profile } = useProfile(currentUserId);
  const whatIfScenario = useWhatIfScenario();

  // Get subscriptions from profile signals
  const subscriptions: Subscription[] = React.useMemo(() => {
    if (!profile?.signals?.subscriptions) return [];
    
    // Extract subscription data from signals
    // For now, we'll create a mock list based on detected subscriptions
    // In a real app, this would come from actual transaction analysis
    const numSubscriptions = profile.signals.subscriptions.num_recurring_merchants || 0;
    
    // Create subscription list (in real app, this would be from actual data)
    const commonSubscriptions: Subscription[] = [
      { name: 'Netflix', amount: 15.99 },
      { name: 'Spotify', amount: 10.99 },
      { name: 'Adobe Creative', amount: 22.99 },
      { name: 'Gym Membership', amount: 45.00 },
      { name: 'Amazon Prime', amount: 14.99 },
      { name: 'Disney+', amount: 10.99 },
    ];
    
    // Return up to numSubscriptions or default list
    return commonSubscriptions.slice(0, Math.max(numSubscriptions, 6));
  }, [profile]);

  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());

  // Run simulation when selections change
  useEffect(() => {
    if (currentUserId && selectedSubscriptions.size > 0) {
      const subscriptionsToCancel = subscriptions
        .filter(sub => selectedSubscriptions.has(sub.name))
        .map(sub => ({ name: sub.name, amount: sub.amount }));

      whatIfScenario.mutate({
        userId: currentUserId,
        scenario: {
          scenario_type: 'subscription_cancellation',
          params: {
            subscriptions_to_cancel: subscriptionsToCancel,
            months: 12,
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, selectedSubscriptions, subscriptions]);

  const handleToggleSubscription = (name: string) => {
    setSelectedSubscriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  if (!currentUserId) {
    return (
      <Card>
        <p className="text-gray-500">Please select a user to run simulations.</p>
      </Card>
    );
  }

  const result = whatIfScenario.data;
  const isLoading = whatIfScenario.isPending;
  const error = whatIfScenario.error;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Cancellation</h3>
      
      {/* Subscription List */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Select subscriptions to cancel:
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {subscriptions.map((sub) => (
            <label
              key={sub.name}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
            >
              <input
                type="checkbox"
                checked={selectedSubscriptions.has(sub.name)}
                onChange={() => handleToggleSubscription(sub.name)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{sub.name}</span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(sub.amount)}/month
                </span>
              </div>
            </label>
          ))}
        </div>
        {subscriptions.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No recurring subscriptions detected.</p>
        )}
      </div>

      {/* Results */}
      {selectedSubscriptions.size === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Select subscriptions above to see projected savings.</p>
        </div>
      )}

      {isLoading && selectedSubscriptions.size > 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {error && selectedSubscriptions.size > 0 && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to run simulation'} />
      )}

      {result && result.scenario_type === 'subscription_cancellation' && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Projected Savings</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Savings</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(result.monthly_savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Annual Savings</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(result.annual_savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Flow Freed</span>
                <span className="font-semibold text-primary-600">
                  {result.percent_reduction.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {result.alternative_uses && result.alternative_uses.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Alternative uses:</h5>
              <ul className="space-y-1">
                {result.alternative_uses.map((use: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendation && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

