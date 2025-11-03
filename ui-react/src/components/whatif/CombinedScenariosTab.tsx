/**
 * CombinedScenariosTab Component
 * Run multiple scenarios together and see combined impact
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

export const CombinedScenariosTab: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: accountsData } = useUserAccounts(currentUserId);
  const { data: profile } = useProfile(currentUserId);
  const whatIfScenario = useWhatIfScenario();

  // Scenario states
  const [includeExtraPayment, setIncludeExtraPayment] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState(200);
  const [includeCancelSubscriptions, setIncludeCancelSubscriptions] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [includeIncreaseSavings, setIncludeIncreaseSavings] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(500);

  // Get subscriptions from profile
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

  // Find credit card account
  const creditCard = accountsData?.accounts.find(acc => acc.type === 'credit card');
  const accountId = creditCard?.account_id;

  const handleRunCombined = () => {
    if (!currentUserId) return;

    const scenarios: any[] = [];

    // Extra payment scenario
    if (includeExtraPayment && accountId && extraPaymentAmount > 0) {
      scenarios.push({
        type: 'extra_credit_payment',
        account_id: accountId,
        amount: extraPaymentAmount,
      });
    }

    // Subscription cancellation scenario
    if (includeCancelSubscriptions && selectedSubscriptions.size > 0) {
      scenarios.push({
        type: 'subscription_cancellation',
        subscriptions: subscriptions
          .filter(sub => selectedSubscriptions.has(sub.name))
          .map(sub => ({ name: sub.name, amount: sub.amount })),
      });
    }

    // Increase savings scenario
    if (includeIncreaseSavings && savingsAmount > 0) {
      scenarios.push({
        type: 'increased_savings',
        amount: savingsAmount,
      });
    }

    if (scenarios.length === 0) {
      return;
    }

    whatIfScenario.mutate({
      userId: currentUserId,
      scenario: {
        scenario_type: 'combined',
        params: {
          scenarios,
          months: 12,
        },
      },
    });
  };

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

  const hasAnyScenarioSelected = includeExtraPayment || includeCancelSubscriptions || includeIncreaseSavings;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Combined Scenario Builder</h3>
        
        {/* Extra Credit Payment */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExtraPayment}
              onChange={(e) => setIncludeExtraPayment(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="font-medium text-gray-900">Extra Credit Payment</span>
          </label>
          {includeExtraPayment && (
            <div className="ml-7 mt-2">
              <input
                type="number"
                value={extraPaymentAmount}
                onChange={(e) => setExtraPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="200"
                min="0"
                className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Monthly extra payment amount</p>
            </div>
          )}
        </div>

        {/* Cancel Subscriptions */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCancelSubscriptions}
              onChange={(e) => setIncludeCancelSubscriptions(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="font-medium text-gray-900">Cancel Subscriptions</span>
          </label>
          {includeCancelSubscriptions && (
            <div className="ml-7 mt-2">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subscriptions.map((sub) => (
                  <label
                    key={sub.name}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubscriptions.has(sub.name)}
                      onChange={() => handleToggleSubscription(sub.name)}
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
        </div>

        {/* Increase Savings */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeIncreaseSavings}
              onChange={(e) => setIncludeIncreaseSavings(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="font-medium text-gray-900">Increase Savings</span>
          </label>
          {includeIncreaseSavings && (
            <div className="ml-7 mt-2">
              <input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(parseFloat(e.target.value) || 0)}
                placeholder="500"
                min="0"
                className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Monthly savings contribution</p>
            </div>
          )}
        </div>

        {/* Run Button */}
        <Button
          variant="primary"
          onClick={handleRunCombined}
          disabled={isLoading || !hasAnyScenarioSelected}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Running...
            </span>
          ) : (
            'Run Combined Scenario'
          )}
        </Button>

        {!hasAnyScenarioSelected && (
          <p className="text-sm text-gray-500 mt-2">Please select at least one scenario to run.</p>
        )}
      </Card>

      {/* Results */}
      {error && (
        <Card>
          <ErrorMessage message={error instanceof Error ? error.message : 'Failed to run combined scenario'} />
        </Card>
      )}

      {result && result.scenario_type === 'combined' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Combined Scenario Impact</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Monthly Cash Flow Impact</div>
                <div className={`text-2xl font-bold ${result.monthly_cash_flow_impact >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(result.monthly_cash_flow_impact)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Annual Cash Flow Impact</div>
                <div className={`text-2xl font-bold ${result.annual_cash_flow_impact >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(result.annual_cash_flow_impact)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Interest Saved</div>
                <div className="text-xl font-semibold text-success-600">
                  {formatCurrency(result.total_interest_saved)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Subscription Savings</div>
                <div className="text-xl font-semibold text-purple-600">
                  {formatCurrency(result.total_subscription_savings)}
                </div>
              </div>
            </div>

            {result.summary && result.summary.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <ul className="space-y-1">
                  {result.summary.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
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
        </Card>
      )}
    </div>
  );
};

