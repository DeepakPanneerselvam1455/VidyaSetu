

import React from 'react';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  description?: string;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, title, description }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-lg m-4 rounded-lg border border-slate-200 bg-white text-slate-950 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-white",
          "animate-in fade-in-0 zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b dark:border-slate-800">
          <h3 className="text-xl font-semibold leading-none tracking-tight">{title}</h3>
          {description && <p className="text-sm text-slate-500 dark:text-slate-300">{description}</p>}
        </div>
        
        <div className="p-6">
            {children}
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <XIcon className="w-[18px] h-[18px]" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);


export default Dialog;