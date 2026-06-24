'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Body scroll-lock
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop overlay click */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-slide-up z-10 focus:outline-none max-h-[95vh] flex flex-col",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
          {title ? (
            <h3 className="text-base font-bold tracking-tight text-foreground uppercase">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </div>
    </div>,
    document.body
  );
}
