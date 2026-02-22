
import React from 'react';
import ReactDOM from 'react-dom';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, title, description }) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use Portal to render at document body level (avoids z-index stacking context issues)
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* 1. Dedicated Backdrop Layer (Click to close) */}
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity opacity-100"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Content Layer (Stays sharp, no blur inheritance) */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md m-4 rounded-xl border shadow-2xl flex flex-col scale-100 opacity-100",
          "animate-in fade-in-0 zoom-in-95"
        )}
        style={{
          backgroundColor: 'var(--card-bg)', // Ensure this variable is OPAQUE in index.css
          borderColor: 'var(--border-default)',
          color: 'var(--text-main)',
          // Strong shadow for separation
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col space-y-1.5 p-6 pb-4"
        >
          {title && <h3 className="text-xl font-semibold leading-none tracking-tight" style={{ color: 'var(--text-heading)' }}>{title}</h3>}
          {description && <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
        </div>

        <div className="p-6 pt-0 overflow-y-auto max-h-[80vh]">
          {children}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;