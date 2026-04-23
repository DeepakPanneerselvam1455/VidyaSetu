
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* 1. Backdrop — reduced opacity so underlying content remains readable */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Content — explicit white bg so no dark-mode variables bleed in */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl overflow-hidden",
          "bg-white text-gray-900",
          "border border-gray-200",
          "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)]",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent stripe */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="flex flex-col space-y-1.5 px-6 pt-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-[1.1rem] font-bold leading-tight text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm mt-1 text-gray-500">
                  {description}
                </p>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;