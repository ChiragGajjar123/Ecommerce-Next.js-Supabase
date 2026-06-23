import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors select-none",
        variant === 'default' && "border-transparent bg-primary text-primary-foreground",
        variant === 'secondary' && "border-transparent bg-secondary text-secondary-foreground",
        variant === 'outline' && "text-foreground border-border bg-transparent",
        variant === 'destructive' && "border-transparent bg-destructive text-destructive-foreground",
        variant === 'success' && "border-transparent bg-primary/10 text-primary border border-primary/20",
        className
      )}
      {...props}
    />
  );
}
