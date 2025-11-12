import React from 'react';
import { cn } from '../../lib/utils';

interface PasswordStrengthProps {
  level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  text: string;
}

const strengthLevels = {
  'none': { barColor: 'bg-slate-300 dark:bg-slate-700', textColor: 'text-slate-500', width: '0%' },
  'very weak': { barColor: 'bg-red-500', textColor: 'text-red-500', width: '20%' },
  'weak': { barColor: 'bg-orange-500', textColor: 'text-orange-500', width: '40%' },
  'medium': { barColor: 'bg-yellow-500', textColor: 'text-yellow-500', width: '60%' },
  'strong': { barColor: 'bg-lime-500', textColor: 'text-lime-500', width: '80%' },
  'very strong': { barColor: 'bg-green-500', textColor: 'text-green-500', width: '100%' },
};

const PasswordStrengthMeter: React.FC<PasswordStrengthProps> = ({ level, text }) => {
  if (level === 'none' || !text) {
    // Keep space to prevent layout shift
    return <div className="h-5 mt-1" />;
  }
  
  const { barColor, textColor, width } = strengthLevels[level];

  return (
    <div className="space-y-1 mt-1">
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
        <div 
          className={cn("h-1.5 rounded-full transition-all duration-300", barColor)} 
          style={{ width }}
        ></div>
      </div>
      <p className={cn("text-xs font-semibold", textColor)}>{text}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
