import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, asChild = false }) => {
  const { isOpen, setIsOpen } = useDropdownMenu();
  const child = React.Children.only(children) as React.ReactElement;

  const triggerProps = {
    onClick: (e: React.MouseEvent) => {
      setIsOpen(!isOpen);
      // Fix: Cast child.props to any to resolve "Property 'onClick' does not exist on type 'unknown'".
      (child.props as any).onClick?.(e);
    },
    // Fix: Add `as const` to correctly type 'aria-haspopup' and resolve assignment error when spreading props.
    'aria-haspopup': 'menu' as const,
    'aria-expanded': isOpen,
  };

  if (asChild) {
    return React.cloneElement(child, triggerProps);
  }

  return <div {...triggerProps}>{children}</div>;
};

export const DropdownMenuContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end';
}> = ({ children, className, align = 'start' }) => {
  const { isOpen, setIsOpen } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-2 w-56 origin-top-right rounded-xl focus:outline-none',
        'animate-in fade-in-0 zoom-in-95',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 12px 40px rgba(0,0,0,0.1)',
        color: 'var(--text-main)',
      }}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );
};


export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { setIsOpen } = useDropdownMenu();
  const child = asChild ? React.Children.only(children) as React.ReactElement : null;

  const itemProps = {
    ...props,
    className: cn(
      'block w-full text-left px-4 py-2 text-sm cursor-pointer rounded-md transition-colors duration-150 dropdown-item-themed',
      className
    ),
    style: {
      color: 'var(--text-main)',
      ...props.style,
    },
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      props.onClick?.(e);
      if (child) {
        // Fix: Cast child.props to any to resolve "Property 'onClick' does not exist on type 'unknown'".
        (child.props as any).onClick?.(e);
      }
      setIsOpen(false);
    },
    role: "menuitem",
    ref: ref,
  };

  if (asChild && child) {
    return React.cloneElement(child, {
      ...itemProps,
      // Fix: Cast child.props to any to allow spreading and accessing properties, resolving multiple type errors.
      ...(child.props as any), // Keep original child props
      className: cn(itemProps.className, (child.props as any).className), // Merge classNames
    });
  }

  return <div {...itemProps}>{children}</div>
});
DropdownMenuItem.displayName = 'DropdownMenuItem';


export const DropdownMenuLabel: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ children, className, style, ...props }) => {
  return (
    <div
      className={cn('px-4 py-2 text-xs font-semibold uppercase tracking-wider', className)}
      style={{ color: 'var(--text-secondary)', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};


export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('-mx-1 my-1 h-px', className)} style={{ backgroundColor: 'var(--border-default)' }} />;
};
