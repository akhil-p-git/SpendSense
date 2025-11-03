/**
 * BasicScenariosTab Component
 * Displays all three basic scenario simulators
 */

import React from 'react';
import { ExtraDebtPayment } from './ExtraDebtPayment';
import { SubscriptionCancellation } from './SubscriptionCancellation';
import { IncreasedSavings } from './IncreasedSavings';

export const BasicScenariosTab: React.FC = () => {
  return (
    <div className="space-y-8">
      <ExtraDebtPayment />
      <SubscriptionCancellation />
      <IncreasedSavings />
    </div>
  );
};

