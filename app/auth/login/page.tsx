'use client';

import React, { useActionState, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/actions/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [rememberMe, setRememberMe] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (state) {
      if (state.error) {
        toast.error(state.error);
      } else if (state.data) {
        toast.success(`Welcome back, ${state.data.profile.full_name || 'Customer'}!`);
        router.push(redirect);
      }
    }
  }, [state, router, redirect]);

  const handleGoogleLogin = async () => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-black text-xl tracking-wider text-primary uppercase select-none">
            CMG
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground uppercase mt-4">Welcome Back</h2>
          <p className="text-xs text-muted-foreground mt-1">Please enter your credentials to login.</p>
        </div>

        {/* Login Form */}
        <form action={formAction} className="flex flex-col gap-5">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
          </div>

          <input type="hidden" name="rememberMe" value={rememberMe ? 'true' : 'false'} />

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs font-semibold text-muted-foreground select-none cursor-pointer">
              Remember Me
            </label>
          </div>

          <Button type="submit" className="w-full uppercase text-xs font-bold tracking-wider" isLoading={isPending}>
            Log In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative px-3 bg-card text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Or continue with
          </span>
        </div>

        {/* OAuth Buttons */}
        <Button onClick={handleGoogleLogin} variant="outline" className="w-full uppercase text-xs font-bold tracking-wider gap-2">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

        {/* Footer Link */}
        <p className="text-xs text-muted-foreground text-center mt-8 font-medium">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-bold text-primary hover:text-primary/80 transition-colors uppercase">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm text-center">
          <span className="font-black text-xl tracking-wider text-primary uppercase select-none block mb-4">
            CMG
          </span>
          <p className="text-xs text-muted-foreground">Loading login form...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
