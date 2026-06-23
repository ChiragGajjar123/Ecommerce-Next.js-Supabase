'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import { resendVerificationAction } from '@/lib/actions/actions';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email parameter is missing.');
      return;
    }

    setResending(true);
    const res = await resendVerificationAction(email);
    setResending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Verification email sent successfully.');
      setCountdown(60); // Reset countdown
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
        
        {/* Envelope Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">Verify Your Email</h2>
        
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          We have sent a verification link to <span className="font-bold text-foreground">{email || 'your email'}</span>. 
          Please check your inbox and click the link to activate your account.
        </p>

        {/* Resend actions */}
        <div className="w-full border-t border-border mt-8 pt-6 flex flex-col gap-3">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Didn't receive the email?
          </p>
          
          <Button
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            isLoading={resending}
            variant="outline"
            className="w-full uppercase text-xs font-bold tracking-wider gap-2 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
          </Button>
        </div>

      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm text-center">
          <p className="text-xs text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
