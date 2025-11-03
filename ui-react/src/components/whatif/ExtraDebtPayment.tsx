/**
 * ExtraDebtPayment Component
 * Simulates paying extra on credit card debt
 */

import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { useUserAccounts } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency, formatPercentage } from '@/utils/format';

export const ExtraDebtPayment: React.FC = () => {
  const { currentUserId } = useStore();
  const { data: accountsData } = useUserAccounts(currentUserId);
  const whatIfScenario = useWhatIfScenario();
  
  const [extraPayment, setExtraPayment] = useState(300);
  const debouncedPayment = useDebounce(extraPayment, 500); // 500ms debounce
  
  // Find credit card account
  const creditCard = accountsData?.accounts.find(acc => acc.type === 'credit card');
  const accountId = creditCard?.account_id;

  // Run simulation when debounced value changes
  useEffect(() => {
    if (currentUserId && accountId && debouncedPayment >= 0) {
      whatIfScenario.mutate({
        userId: currentUserId,
        scenario: {
          scenario_type: 'extra_credit_payment',
          params: {
            account_id: accountId,
            extra_monthly_payment: debouncedPayment,
            months: 12,
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, accountId, debouncedPayment]);

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
  const isLoading = whatIfScenario.isPending;
  const error = whatIfScenario.error;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Extra Debt Payment</h3>
      
      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Extra Monthly Payment</label>
          <span className="text-lg font-semibold text-primary-600">
            {formatCurrency(extraPayment)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          value={extraPayment}
          onChange={(e) => setExtraPayment(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$1,000</span>
        </div>
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

      {result && result.scenario_type === 'extra_credit_payment' && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Current Balance</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.current_balance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">APR</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatPercentage(result.apr)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Projected Impact</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Payoff Date</span>
                <span className="font-semibold text-gray-900">
                  {result.extra_payment_scenario.months_to_payoff.toFixed(0)} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Interest Saved</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(result.savings.interest_saved)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Months Saved</span>
                <span className="font-semibold text-primary-600">
                  {result.savings.months_saved.toFixed(0)} months
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
  );
};

