import React from 'react';

export interface FormErrorProps {
  error?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <p 
      className={`text-xs mt-1.5 flex items-center gap-1.5 ${className}`}
      style={{ color: 'hsl(0 65% 50%)' }}
      role="alert"
      aria-live="polite"
    >
      <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
};

const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    {...props} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
