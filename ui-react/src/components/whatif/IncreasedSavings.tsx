/**
 * IncreasedSavings Component
 * Simulates increasing monthly savings contributions
 */

import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/format';

export const IncreasedSavings: React.FC = () => {
  const { currentUserId } = useStore();
  const whatIfScenario = useWhatIfScenario();
  
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [targetAmount, setTargetAmount] = useState<string>('');
  const debouncedAmount = useDebounce(monthlyAmount, 500); // 500ms debounce
  
  // Run simulation when debounced value changes
  useEffect(() => {
    if (currentUserId && debouncedAmount >= 0) {
      whatIfScenario.mutate({
        userId: currentUserId,
        scenario: {
          scenario_type: 'increased_savings',
          params: {
            monthly_amount: debouncedAmount,
            target_amount: targetAmount ? parseFloat(targetAmount) : null,
            months: 12,
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, debouncedAmount, targetAmount]);

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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Increased Savings</h3>
      
      {/* Monthly Amount Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Monthly Savings Amount</label>
          <span className="text-lg font-semibold text-primary-600">
            {formatCurrency(monthlyAmount)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2000"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$2,000</span>
        </div>
      </div>

      {/* Target Amount Input */}
      <div className="mb-6">
        <label htmlFor="target-amount" className="block text-sm font-medium text-gray-700 mb-2">
          Target Amount (optional)
        </label>
        <input
          type="number"
          id="target-amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="e.g., 10000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {error && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to run simulation'} />
      )}

      {result && result.scenario_type === 'increased_savings' && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Current Savings</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.current_state.savings_balance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Monthly Contribution</div>
              <div className="text-lg font-semibold text-primary-600">
                {formatCurrency(result.monthly_contribution)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Projected Growth (12 months)</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Final Balance</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(result.projected_state.final_balance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Your Contributions</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(result.projected_state.total_contributions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interest Earned</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(result.projected_state.interest_earned)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Emergency Fund Coverage</span>
                <span className="font-semibold text-primary-600">
                  {result.projected_state.emergency_fund_months.toFixed(1)} months
                </span>
              </div>
              {result.months_to_target && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time to Reach Goal</span>
                  <span className="font-semibold text-primary-600">
                    {result.months_to_target} months
                  </span>
                </div>
              )}
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
  );
};

