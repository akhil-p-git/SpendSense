import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-primary-600 border border-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[44px]',
  };
  
  // Allow custom className to override styles
  const finalClassName = className 
    ? `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
    : `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button
      ref={ref}
      className={finalClassName}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

