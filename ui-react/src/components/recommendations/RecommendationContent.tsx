/**
 * Recommendation Content Component
 * Routes to appropriate content type based on recommendation
 */

import React from 'react';
import type { Recommendation } from '@/types';
import { CreditCardCalculator } from './CreditCardCalculator';
import { EducationalGuide } from './EducationalGuide';

interface RecommendationContentProps {
  recommendation: Recommendation;
  userSignals?: any;
}

// Content database for different recommendation types
const contentDatabase: Record<string, any> = {
  'Credit Card Interest Calculator': {
    type: 'calculator',
    component: CreditCardCalculator,
  },
  'Understanding Credit Utilization and Your Credit Score': {
    type: 'guide',
    content: `Credit utilization is the ratio of your current credit card balances to your credit limits. It's one of the most important factors in your credit score, accounting for about 30% of your FICO score.

**How It Works:**
Your credit utilization ratio is calculated by dividing your total credit card balances by your total credit limits, then multiplying by 100 to get a percentage.

**Why It Matters:**
Lenders use this ratio to assess how well you manage credit. A high utilization ratio suggests you may be overextended financially, while a low ratio indicates responsible credit management.

**Impact on Credit Score:**
- Below 10%: Excellent - optimal for your score
- 10-30%: Good - healthy credit usage
- 30-50%: Fair - may start impacting your score
- Above 50%: Poor - significantly hurts your score

**The 30% Rule:**
Financial experts recommend keeping your credit utilization below 30%. Even better, aim for under 10% for the best impact on your credit score.`,
    keyTakeaways: [
      'Credit utilization accounts for 30% of your FICO credit score',
      'Keep utilization below 30%, ideally under 10% for best results',
      'Both per-card and overall utilization matter',
      'Paying down balances can quickly improve your score',
    ],
    actionSteps: [
      'Check your current credit utilization ratio across all cards',
      'Pay down high-balance cards first to reduce overall utilization',
      'Set up balance alerts to monitor your utilization monthly',
      'Consider requesting a credit limit increase (but don\'t increase spending)',
      'Make multiple payments per month to keep average daily balance low',
    ],
    relatedTopics: [
      'Building Credit History',
      'Credit Score Factors',
      'Debt Consolidation',
      'Balance Transfer Cards',
    ],
  },
  'Debt Avalanche vs Snowball: Which Payoff Strategy Is Right for You?': {
    type: 'guide',
    content: `When tackling multiple debts, choosing the right payoff strategy can save you thousands in interest and help you become debt-free faster.

**Debt Avalanche Method:**
Pay off debts in order of highest interest rate first, while making minimum payments on others. This method saves the most money on interest over time.

**Debt Snowball Method:**
Pay off debts in order of smallest balance first, regardless of interest rate. This method provides quick wins and psychological motivation.

**Which Method Saves More Money?**
The avalanche method always saves more on interest mathematically. However, the snowball method may work better if you need motivation to stick with your plan.

**When to Use Avalanche:**
- You're disciplined and motivated by long-term savings
- You have high-interest debt (credit cards, payday loans)
- You can stay committed without quick wins

**When to Use Snowball:**
- You need psychological wins to stay motivated
- Your debt balances are similar across accounts
- You've struggled to stick with debt payoff in the past

**The Hybrid Approach:**
Some people combine both methods - start with snowball for quick wins, then switch to avalanche for maximum savings.`,
    keyTakeaways: [
      'Avalanche method saves the most money on interest',
      'Snowball method provides psychological motivation',
      'Both methods work if you stick with them',
      'Your personality matters as much as the math',
    ],
    actionSteps: [
      'List all your debts with balances, interest rates, and minimum payments',
      'Calculate potential interest savings with the avalanche method',
      'Assess your motivation style - do you need quick wins?',
      'Choose your method and commit to it for at least 6 months',
      'Set up automatic payments to ensure minimums are always covered',
      'Track your progress monthly and celebrate milestones',
    ],
    relatedTopics: [
      'Debt Consolidation Loans',
      'Balance Transfer Strategy',
      'Creating a Debt Payoff Plan',
      'Budget Optimization',
    ],
  },
  'Set Up Autopay to Never Miss a Payment': {
    type: 'guide',
    content: `Missing credit card payments can cost you late fees, penalty APRs, and damage to your credit score. Setting up automatic payments is one of the simplest ways to protect your credit and avoid these costly mistakes.

**Why Autopay Matters:**
- Late payments can cost $25-$40 in fees
- Your APR could increase to a penalty rate (often 29.99%)
- One missed payment can drop your credit score by 90-110 points
- Payment history accounts for 35% of your credit score

**Autopay Options:**
1. Minimum Payment: Covers the minimum to avoid late fees
2. Statement Balance: Pays the full balance to avoid interest
3. Fixed Amount: Set a custom amount each month

**Best Practice: Pay Statement Balance**
Always pay your full statement balance to avoid interest charges. This is the sweet spot between managing cash flow and minimizing costs.

**Setting Up Autopay:**
Most credit card issuers allow you to set up autopay through their website or mobile app. You'll link your bank account and choose your payment amount and date.`,
    keyTakeaways: [
      'Payment history is 35% of your credit score',
      'Late payments can increase your APR significantly',
      'Autopay eliminates the risk of forgetting a payment',
      'Paying full statement balance avoids interest charges',
    ],
    actionSteps: [
      'Log into your credit card account online',
      'Navigate to "Payments" or "Autopay" settings',
      'Link your checking account for automatic payments',
      'Select "Full Statement Balance" as your payment amount',
      'Choose a payment date 2-3 days before the due date',
      'Set up account alerts to monitor your balance',
      'Review your statements monthly even with autopay',
    ],
    relatedTopics: [
      'Building Credit History',
      'Budgeting for Fixed Expenses',
      'Cash Flow Management',
      'Credit Score Protection',
    ],
  },
};

export const RecommendationContent: React.FC<RecommendationContentProps> = ({
  recommendation,
  userSignals,
}) => {
  const content = contentDatabase[recommendation.title];

  if (!content) {
    // Fallback for recommendations without detailed content
    return (
      <div className="space-y-4">
        <div className="text-gray-700 leading-relaxed">
          <p className="mb-4">{recommendation.description}</p>
          {recommendation.rationale && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Why this recommendation:</strong>{' '}
                {recommendation.rationale}
              </p>
            </div>
          )}
        </div>

        {recommendation.url && (
          <div>
            <a
              href={recommendation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Learn more at external resource
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}

        <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-4">
          This is educational content, not financial advice. Consult a licensed advisor for
          personalized guidance.
        </div>
      </div>
    );
  }

  // Render calculator
  if (content.type === 'calculator') {
    const Calculator = content.component;
    const initialBalance = userSignals?.credit?.total_credit_balance || 5000;
    return <Calculator initialBalance={initialBalance} />;
  }

  // Render guide
  if (content.type === 'guide') {
    return (
      <EducationalGuide
        title={recommendation.title}
        content={content.content}
        keyTakeaways={content.keyTakeaways}
        actionSteps={content.actionSteps}
        relatedTopics={content.relatedTopics}
      />
    );
  }

  return null;
};
