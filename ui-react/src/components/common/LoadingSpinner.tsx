import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

export const LoadingSpinner = React.memo<LoadingSpinnerProps>(({ size = 'md', 'aria-label': ariaLabel = 'Loading' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className="flex items-center justify-center" role="status" aria-label={ariaLabel}>
      <div
        className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
});
LoadingSpinner.displayName = 'LoadingSpinner';

