/**
 * Credit Card Calculator Component
 * Interactive calculator for credit card payoff scenarios
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';

interface CreditCardCalculatorProps {
  initialBalance?: number;
  initialApr?: number;
  initialMinPayment?: number;
}

export const CreditCardCalculator: React.FC<CreditCardCalculatorProps> = ({
  initialBalance = 5000,
  initialApr = 18.99,
  initialMinPayment = 150,
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [apr, setApr] = useState(initialApr);
  const [monthlyPayment, setMonthlyPayment] = useState(initialMinPayment);
  const [results, setResults] = useState<{
    monthsToPayoff: number;
    totalInterest: number;
    totalPaid: number;
  } | null>(null);

  const calculatePayoff = () => {
    let currentBalance = balance;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = apr / 100 / 12;

    while (currentBalance > 0 && months < 600) {
      const interestCharge = currentBalance * monthlyRate;
      totalInterest += interestCharge;
      currentBalance = currentBalance + interestCharge - monthlyPayment;
      months++;

      if (currentBalance < 0) currentBalance = 0;
    }

    setResults({
      monthsToPayoff: months,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPaid: Math.round((balance + totalInterest) * 100) / 100,
    });
  };

  useEffect(() => {
    if (balance > 0 && monthlyPayment > 0) {
      calculatePayoff();
    }
  }, [balance, apr, monthlyPayment]);

  const minPaymentPercent = ((monthlyPayment / balance) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
            Current Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="apr" className="block text-sm font-medium text-gray-700 mb-2">
            APR (Annual %)
          </label>
          <div className="relative">
            <input
              id="apr"
              type="number"
              value={apr}
              onChange={(e) => setApr(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Payment
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="payment"
              type="number"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {minPaymentPercent}% of balance
          </p>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-1">Time to Pay Off</p>
            <p className="text-2xl font-bold text-blue-900">
              {results.monthsToPayoff} months
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {Math.floor(results.monthsToPayoff / 12)} years, {results.monthsToPayoff % 12} months
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600 font-medium mb-1">Total Interest</p>
            <p className="text-2xl font-bold text-red-900">${results.totalInterest.toLocaleString()}</p>
            <p className="text-sm text-red-600 mt-1">
              {((results.totalInterest / balance) * 100).toFixed(1)}% of principal
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-medium mb-1">Total Amount Paid</p>
            <p className="text-2xl font-bold text-green-900">${results.totalPaid.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">Principal + Interest</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">What if you paid more?</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthlyPayment(monthlyPayment + 50)}
          >
            +$50/month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthlyPayment(monthlyPayment + 100)}
          >
            +$100/month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthlyPayment(monthlyPayment + 200)}
          >
            +$200/month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthlyPayment(initialMinPayment)}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Educational Tips */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips to Save on Interest</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Pay more than the minimum to reduce interest charges</li>
          <li>• Consider a balance transfer to a lower APR card</li>
          <li>• Set up automatic payments to never miss a due date</li>
          <li>• Pay bi-weekly instead of monthly to reduce average daily balance</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-4">
        This calculator provides estimates for educational purposes. Actual results may vary based on
        your card terms, fees, and payment timing. This is not financial advice.
      </div>
    </div>
  );
};
