'use client';

import React from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/utils/cn';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
    
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().addToast('success', msg, duration),
  error: (msg: string, duration?: number) => useToastStore.getState().addToast('error', msg, duration),
  info: (msg: string, duration?: number) => useToastStore.getState().addToast('info', msg, duration),
};

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertTriangle : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg shadow-lg border pointer-events-auto transition-all duration-300 animate-slide-up bg-card",
              t.type === 'success' && 'border-primary/30 text-foreground',
              t.type === 'error' && 'border-destructive/30 text-destructive',
              t.type === 'info' && 'border-secondary/30 text-foreground'
            )}
            role="alert"
          >
            <Icon className={cn(
              "w-5 h-5 shrink-0 mt-0.5",
              t.type === 'success' && 'text-primary',
              t.type === 'error' && 'text-destructive',
              t.type === 'info' && 'text-secondary'
            )} />
            <div className="flex-1 text-sm font-medium leading-relaxed">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
