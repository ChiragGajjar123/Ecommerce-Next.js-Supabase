'use client';

import React, { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerAction } from '@/lib/actions/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function Register() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, null);

  useEffect(() => {
    if (state) {
      if (state.error) {
        toast.error(state.error);
      } else if (state.data) {
        toast.success('Registration successful! Please verify your email.');
        // Extract email to pass to the verification screen
        const formElement = document.querySelector('form');
        const emailInput = formElement?.querySelector('input[name="email"]') as HTMLInputElement;
        const email = emailInput?.value || '';
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      }
    }
  }, [state, router]);

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-black text-xl tracking-wider text-primary uppercase select-none">
            CMG
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground uppercase mt-4">Create Account</h2>
          <p className="text-xs text-muted-foreground mt-1">Join us to experience personalized shopping.</p>
        </div>

        {/* Signup Form */}
        <form action={formAction} className="flex flex-col gap-5">
          <Input
            label="Full Name"
            type="text"
            name="fullName"
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground leading-normal mt-1">
              Must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 special symbol.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              Verify Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
          </div>

          <Button type="submit" className="w-full uppercase text-xs font-bold tracking-wider" isLoading={isPending}>
            Create Account
          </Button>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-muted-foreground text-center mt-8 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-primary hover:text-primary/80 transition-colors uppercase">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
