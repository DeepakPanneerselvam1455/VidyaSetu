
import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border-2 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 select-themed',
          className
        )}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-main)',
          ...style
        }}
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
