'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function VerificationBanner() {
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('plobie_verification_dismissed');
    if (dismissed) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.email_confirmed_at) {
        setShow(true);
      }
    });
  }, []);

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (res.ok) {
        setSent(true);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('plobie_verification_dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300 truncate">
            {sent
              ? 'Verification email sent! Check your inbox.'
              : 'Please verify your email to unlock all features.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!sent && (
            <button
              onClick={handleResend}
              disabled={sending}
              className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Resend'}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-amber-500 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
