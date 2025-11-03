import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg flex items-center justify-between">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-danger-600 hover:text-danger-800"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

