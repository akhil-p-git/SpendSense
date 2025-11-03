/**
 * PersonaBadge Component
 * Displays persona name with color coding and description
 */

import React from 'react';
import type { Persona } from '@/types';
import { Card } from '@/components/common/Card';

interface PersonaBadgeProps {
  persona: Persona;
  rationale?: string;
}

const personaColors = {
  high_utilization: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    border: 'border-danger-300',
  },
  variable_income: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    border: 'border-warning-300',
  },
  subscription_heavy: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
  emergency_fund_starter: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
  },
  savings_builder: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-300',
  },
};

export const PersonaBadge: React.FC<PersonaBadgeProps> = ({ persona, rationale }) => {
  const personaId = persona.primary_persona as keyof typeof personaColors;
  const colors = personaColors[personaId] || personaColors.high_utilization;

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`px-4 py-2 rounded-lg font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
          {persona.persona_name}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">{persona.primary_focus}</p>
          {rationale && (
            <p className="text-sm text-gray-600">{rationale}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

