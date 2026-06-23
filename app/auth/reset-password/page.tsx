'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPasswordAction } from '@/lib/actions/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { Lock } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [strength, setStrength] = useState({ label: 'None', color: 'bg-border', percent: 0 });

  useEffect(() => {
    if (!code) {
      toast.error('Reset token is missing. Please request a new link.');
    }
  }, [code]);

  useEffect(() => {
    if (!password) {
      setStrength({ label: 'None', color: 'bg-border', percent: 0 });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 8) {
      setStrength({ label: 'Weak (Min 8 chars)', color: 'bg-destructive', percent: 25 });
    } else if (score === 2) {
      setStrength({ label: 'Fair', color: 'bg-amber-500', percent: 50 });
    } else if (score === 3) {
      setStrength({ label: 'Strong', color: 'bg-primary/75', percent: 75 });
    } else if (score === 4) {
      setStrength({ label: 'Very Strong', color: 'bg-primary', percent: 100 });
    } else {
      setStrength({ label: 'Weak', color: 'bg-destructive', percent: 25 });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Invalid recovery session.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordAction(code, { password, confirmPassword });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Your password has been reset successfully. Please log in.');
      router.push('/auth/login');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">Set New Password</h2>
          <p className="text-xs text-muted-foreground mt-1">Please enter your new credentials below.</p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!code}
            />
            
            {/* Complexity Meter */}
            {password && (
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={strength.percent <= 25 ? 'text-destructive' : strength.percent <= 50 ? 'text-amber-500' : 'text-primary'}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.percent}%` }} />
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!code}
          />

          <Button
            type="submit"
            className="w-full uppercase text-xs font-bold tracking-wider"
            isLoading={loading}
            disabled={!code}
          >
            Update Password
          </Button>
        </form>

      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm text-center">
          <p className="text-xs text-muted-foreground">Loading password reset form...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
