'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '@/lib/actions/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { KeyRound } from 'lucide-react';
import { ROUTES } from '@/lib/utils/routes';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [throttle, setThrottle] = useState(0);

  useEffect(() => {
    if (throttle > 0) {
      const timer = setTimeout(() => setThrottle(throttle - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [throttle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || throttle > 0) return;

    setLoading(true);
    const res = await forgotPasswordAction(email);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      // Show generic success message always for enumeration defense
      toast.success('If this email is registered, a password reset link has been sent.');
      setThrottle(30); // Throttle subsequent requests for 30s
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">Reset Password</h2>
          <p className="text-xs text-muted-foreground mt-1">Receive a link to create a new password.</p>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={throttle > 0}
          />

          <Button
            type="submit"
            className="w-full uppercase text-xs font-bold tracking-wider"
            isLoading={loading}
            disabled={throttle > 0}
          >
            {throttle > 0 ? `Wait ${throttle}s` : 'Send Reset Link'}
          </Button>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-muted-foreground text-center mt-8 font-medium">
          Remember your password?{' '}
          <Link href={ROUTES.auth.login} className="font-bold text-primary hover:text-primary/80 transition-colors uppercase">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
