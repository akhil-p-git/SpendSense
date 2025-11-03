/**
 * CompareScenariosTab Component
 * Compare two scenarios side-by-side
 */

import React, { useState } from 'react';
import { useWhatIfScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { useUserAccounts, useProfile } from '@/hooks/useApi';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/format';

interface Subscription {
  name: string;
  amount: number;
}

type ScenarioType = 'extra_credit_payment' | 'subscription_cancellation' | 'increased_savings' | '';

interface ScenarioParams {
  type: ScenarioType;
  amount?: number;
  target_amount?: number;
  subscriptions?: Array<{ name: string; amount: number }>;
}

export const CompareScenariosTab: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: accountsData } = useUserAccounts(currentUserId);
  const { data: profile } = useProfile(currentUserId);
  const whatIfScenario = useWhatIfScenario();

  // Scenario A state
  const [scenarioAType, setScenarioAType] = useState<ScenarioType>('');
  const [scenarioAParams, setScenarioAParams] = useState<ScenarioParams>({ type: '' });

  // Scenario B state
  const [scenarioBType, setScenarioBType] = useState<ScenarioType>('');
  const [scenarioBParams, setScenarioBParams] = useState<ScenarioParams>({ type: '' });

  // Find credit card account
  const creditCard = accountsData?.accounts.find(acc => acc.type === 'credit card');
  const accountId = creditCard?.account_id;

  // Get subscriptions
  const subscriptions: Subscription[] = React.useMemo(() => {
    if (!profile?.signals?.subscriptions) return [];
    
    const numSubscriptions = profile.signals.subscriptions.num_recurring_merchants || 0;
    
    const commonSubscriptions: Subscription[] = [
      { name: 'Netflix', amount: 15.99 },
      { name: 'Spotify', amount: 10.99 },
      { name: 'Adobe Creative', amount: 22.99 },
      { name: 'Gym Membership', amount: 45.00 },
      { name: 'Amazon Prime', amount: 14.99 },
      { name: 'Disney+', amount: 10.99 },
    ];
    
    return commonSubscriptions.slice(0, Math.max(numSubscriptions, 6));
  }, [profile]);

  const updateScenarioAParams = (type: ScenarioType) => {
    setScenarioAType(type);
    if (type === 'extra_credit_payment') {
      setScenarioAParams({ type, amount: 200 });
    } else if (type === 'subscription_cancellation') {
      setScenarioAParams({ type, subscriptions: [] });
    } else if (type === 'increased_savings') {
      setScenarioAParams({ type, amount: 500 });
    } else {
      setScenarioAParams({ type: '' });
    }
  };

  const updateScenarioBParams = (type: ScenarioType) => {
    setScenarioBType(type);
    if (type === 'extra_credit_payment') {
      setScenarioBParams({ type, amount: 200 });
    } else if (type === 'subscription_cancellation') {
      setScenarioBParams({ type, subscriptions: [] });
    } else if (type === 'increased_savings') {
      setScenarioBParams({ type, amount: 500 });
    } else {
      setScenarioBParams({ type: '' });
    }
  };

  const handleCompare = () => {
    if (!currentUserId || !scenarioAType || !scenarioBType) return;

    // Build scenario A
    const scenarioA: any = { type: scenarioAType };
    if (scenarioAType === 'extra_credit_payment') {
      scenarioA.account_id = accountId;
      scenarioA.amount = scenarioAParams.amount || 200;
    } else if (scenarioAType === 'subscription_cancellation') {
      scenarioA.subscriptions = scenarioAParams.subscriptions || [];
    } else if (scenarioAType === 'increased_savings') {
      scenarioA.amount = scenarioAParams.amount || 500;
      scenarioA.target_amount = scenarioAParams.target_amount || null;
    }

    // Build scenario B
    const scenarioB: any = { type: scenarioBType };
    if (scenarioBType === 'extra_credit_payment') {
      scenarioB.account_id = accountId;
      scenarioB.amount = scenarioBParams.amount || 200;
    } else if (scenarioBType === 'subscription_cancellation') {
      scenarioB.subscriptions = scenarioBParams.subscriptions || [];
    } else if (scenarioBType === 'increased_savings') {
      scenarioB.amount = scenarioBParams.amount || 500;
      scenarioB.target_amount = scenarioBParams.target_amount || null;
    }

    whatIfScenario.mutate({
      userId: currentUserId,
      scenario: {
        scenario_type: 'compare',
        params: {
          scenario_a: scenarioA,
          scenario_b: scenarioB,
        },
      },
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

  const canCompare = scenarioAType && scenarioBType;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compare Two Scenarios</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario A */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Scenario A</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scenario Type
              </label>
              <select
                value={scenarioAType}
                onChange={(e) => updateScenarioAParams(e.target.value as ScenarioType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select scenario type...</option>
                <option value="extra_credit_payment">Extra Credit Payment</option>
                <option value="subscription_cancellation">Cancel Subscriptions</option>
                <option value="increased_savings">Increase Savings</option>
              </select>
            </div>

            {/* Dynamic params for Scenario A */}
            {scenarioAType === 'extra_credit_payment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Payment Amount
                </label>
                <input
                  type="number"
                  value={scenarioAParams.amount || 200}
                  onChange={(e) => setScenarioAParams({ ...scenarioAParams, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {scenarioAType === 'subscription_cancellation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subscriptions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {subscriptions.map((sub) => (
                    <label
                      key={sub.name}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={scenarioAParams.subscriptions?.some(s => s.name === sub.name) || false}
                        onChange={(e) => {
                          const current = scenarioAParams.subscriptions || [];
                          if (e.target.checked) {
                            setScenarioAParams({
                              ...scenarioAParams,
                              subscriptions: [...current, { name: sub.name, amount: sub.amount }],
                            });
                          } else {
                            setScenarioAParams({
                              ...scenarioAParams,
                              subscriptions: current.filter(s => s.name !== sub.name),
                            });
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-900 flex-1">{sub.name}</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(sub.amount)}/month
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {scenarioAType === 'increased_savings' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Savings Amount
                  </label>
                  <input
                    type="number"
                    value={scenarioAParams.amount || 500}
                    onChange={(e) => setScenarioAParams({ ...scenarioAParams, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={scenarioAParams.target_amount || ''}
                    onChange={(e) => setScenarioAParams({ ...scenarioAParams, target_amount: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g., 10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scenario B */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Scenario B</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scenario Type
              </label>
              <select
                value={scenarioBType}
                onChange={(e) => updateScenarioBParams(e.target.value as ScenarioType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select scenario type...</option>
                <option value="extra_credit_payment">Extra Credit Payment</option>
                <option value="subscription_cancellation">Cancel Subscriptions</option>
                <option value="increased_savings">Increase Savings</option>
              </select>
            </div>

            {/* Dynamic params for Scenario B */}
            {scenarioBType === 'extra_credit_payment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Payment Amount
                </label>
                <input
                  type="number"
                  value={scenarioBParams.amount || 200}
                  onChange={(e) => setScenarioBParams({ ...scenarioBParams, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {scenarioBType === 'subscription_cancellation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subscriptions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {subscriptions.map((sub) => (
                    <label
                      key={sub.name}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={scenarioBParams.subscriptions?.some(s => s.name === sub.name) || false}
                        onChange={(e) => {
                          const current = scenarioBParams.subscriptions || [];
                          if (e.target.checked) {
                            setScenarioBParams({
                              ...scenarioBParams,
                              subscriptions: [...current, { name: sub.name, amount: sub.amount }],
                            });
                          } else {
                            setScenarioBParams({
                              ...scenarioBParams,
                              subscriptions: current.filter(s => s.name !== sub.name),
                            });
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-900 flex-1">{sub.name}</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(sub.amount)}/month
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {scenarioBType === 'increased_savings' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Savings Amount
                  </label>
                  <input
                    type="number"
                    value={scenarioBParams.amount || 500}
                    onChange={(e) => setScenarioBParams({ ...scenarioBParams, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={scenarioBParams.target_amount || ''}
                    onChange={(e) => setScenarioBParams({ ...scenarioBParams, target_amount: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g., 10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compare Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={handleCompare}
            disabled={isLoading || !canCompare}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Comparing...
              </span>
            ) : (
              'Compare Scenarios'
            )}
          </Button>
          {!canCompare && (
            <p className="text-sm text-gray-500 mt-2">Please select both scenarios to compare.</p>
          )}
        </div>
      </Card>

      {/* Results */}
      {error && (
        <Card>
          <ErrorMessage message={error instanceof Error ? error.message : 'Failed to compare scenarios'} />
        </Card>
      )}

      {result && result.scenario_type === 'compare' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Comparison</h3>
          
          <div className="space-y-6">
            {/* Scenario Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Scenario A: {result.scenario_a.scenario_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-600">
                  {result.scenario_a.scenario_type === 'extra_credit_payment' && (
                    <span>Extra payment: {formatCurrency(result.scenario_a.extra_payment_scenario?.monthly_payment || 0)}</span>
                  )}
                  {result.scenario_a.scenario_type === 'subscription_cancellation' && (
                    <span>Monthly savings: {formatCurrency(result.scenario_a.monthly_savings || 0)}</span>
                  )}
                  {result.scenario_a.scenario_type === 'increased_savings' && (
                    <span>Final balance: {formatCurrency(result.scenario_a.projected_state?.final_balance || 0)}</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Scenario B: {result.scenario_b.scenario_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-600">
                  {result.scenario_b.scenario_type === 'extra_credit_payment' && (
                    <span>Extra payment: {formatCurrency(result.scenario_b.extra_payment_scenario?.monthly_payment || 0)}</span>
                  )}
                  {result.scenario_b.scenario_type === 'subscription_cancellation' && (
                    <span>Monthly savings: {formatCurrency(result.scenario_b.monthly_savings || 0)}</span>
                  )}
                  {result.scenario_b.scenario_type === 'increased_savings' && (
                    <span>Final balance: {formatCurrency(result.scenario_b.projected_state?.final_balance || 0)}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Comparison Metrics */}
            {result.comparison_metrics && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Comparison Metrics</h4>
                {result.comparison_metrics.better_scenario && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Better Scenario: </span>
                    <span className="font-semibold text-primary-600">
                      Scenario {result.comparison_metrics.better_scenario.toUpperCase()}
                    </span>
                  </div>
                )}
                {result.comparison_metrics.recommendation && (
                  <p className="text-sm text-blue-800">{result.comparison_metrics.recommendation}</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

