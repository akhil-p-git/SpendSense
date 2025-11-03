/**
 * GoalBasedPlanningTab Component
 * Calculate required payment to pay off debt in target months
 */

import React, { useState } from 'react';
import { useWhatIfScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { useUserAccounts } from '@/hooks/useApi';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/format';

export const GoalBasedPlanningTab: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: accountsData } = useUserAccounts(currentUserId);
  const whatIfScenario = useWhatIfScenario();
  
  const [targetMonths, setTargetMonths] = useState(12);
  const [maxPayment, setMaxPayment] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Find credit card account
  const creditCard = accountsData?.accounts.find(acc => acc.type === 'credit card');
  const accountId = creditCard?.account_id;

  const handleCalculate = () => {
    if (!currentUserId || !accountId) return;
    
    setIsCalculating(true);
    whatIfScenario.mutate({
      userId: currentUserId,
      scenario: {
        scenario_type: 'goal_based_payment',
        params: {
          account_id: accountId,
          target_months: targetMonths,
          max_monthly_payment: maxPayment ? parseFloat(maxPayment) : null,
        },
      },
    }, {
      onSettled: () => setIsCalculating(false),
    });
  };

  if (!currentUserId) {
    return (
      <Card>
        <p className="text-gray-500">Please select a user to run simulations.</p>
      </Card>
    );
  }

  if (!accountId) {
    return (
      <Card>
        <ErrorMessage message="No credit card account found for this user." />
      </Card>
    );
  }

  const result = whatIfScenario.data;
  const isLoading = whatIfScenario.isPending || isCalculating;
  const error = whatIfScenario.error;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal-Based Debt Payoff</h3>
        
        {/* Target Months Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Target Months to Payoff</label>
            <span className="text-lg font-semibold text-primary-600">
              {targetMonths} months
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={targetMonths}
            onChange={(e) => setTargetMonths(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>6 months</span>
            <span>60 months</span>
          </div>
        </div>

        {/* Max Payment Input */}
        <div className="mb-6">
          <label htmlFor="max-payment" className="block text-sm font-medium text-gray-700 mb-2">
            Max Monthly Payment (optional)
          </label>
          <input
            type="number"
            id="max-payment"
            value={maxPayment}
            onChange={(e) => setMaxPayment(e.target.value)}
            placeholder="e.g., 1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Calculate Button */}
        <Button
          variant="primary"
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Calculating...
            </span>
          ) : (
            'Calculate Required Payment'
          )}
        </Button>

        {/* Results */}
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error instanceof Error ? error.message : 'Failed to calculate payment'} />
          </div>
        )}

        {result && result.scenario_type === 'goal_based_payment' && (
          <div className="mt-6 space-y-4 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Goal-Based Plan Results</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Required Monthly Payment</span>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(result.required_monthly_payment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Minimum Payment</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(result.current_minimum_payment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Increase Needed</span>
                  <span className="font-semibold text-warning-600">
                    {formatCurrency(result.payment_increase)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Feasible with Goal?</span>
                  <span className={`font-semibold ${result.is_feasible ? 'text-success-600' : 'text-danger-600'}`}>
                    {result.is_feasible ? 'Yes' : 'No'}
                  </span>
                </div>
                {!result.is_feasible && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Actual Months with Max Payment</span>
                    <span className="font-semibold text-gray-900">
                      {result.actual_months.toFixed(0)} months
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Saved</span>
                  <span className="font-semibold text-success-600">
                    {formatCurrency(result.impact.interest_saved)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Months Saved</span>
                  <span className="font-semibold text-primary-600">
                    {result.impact.months_saved.toFixed(0)} months
                  </span>
                </div>
              </div>
            </div>

            {result.recommendation && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">{result.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

