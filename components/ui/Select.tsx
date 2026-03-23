
import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | null;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, style, error, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <select
        className={cn(
          'flex h-11 md:h-10 w-full items-center justify-between rounded-md border-2 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 select-themed',
          hasError && "border-red-500 focus:border-red-600",
          className
        )}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: hasError ? 'hsl(0 65% 50%)' : 'var(--border-default)',
          color: 'var(--text-main)',
          ...style
        }}
        aria-invalid={hasError}
        aria-describedby={hasError && props.id ? `${props.id}-error` : undefined}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
