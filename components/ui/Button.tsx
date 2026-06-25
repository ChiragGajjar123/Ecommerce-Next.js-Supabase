import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', isLoading, disabled, href, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none whitespace-nowrap",
      // Variant options
      variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
      variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-sm",
      variant === 'outline' && "border border-border bg-transparent text-foreground hover:bg-muted",
      variant === 'ghost' && "bg-transparent text-foreground hover:bg-muted",
      variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      // Size options
      size === 'sm' && "h-9 px-3.5 text-xs",
      size === 'md' && "h-11 px-5 text-sm",
      size === 'lg' && "h-12 px-7 text-base",
      size === 'icon' && "h-10 w-10 p-0",
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes} {...(props as any)}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
