'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface NewsletterSectionProps {
  subscribed: boolean;
  nextDate: string | null;
}

export default function NewsletterSection({
  subscribed: initialSubscribed,
  nextDate,
}: NewsletterSectionProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSubscribed(true);
        setEmail('');
        toast.success("You're subscribed to the Plobie newsletter!");
      } else {
        toast.error(data.error?.message || 'Failed to subscribe. Try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6">
      {subscribed ? (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">
              You&apos;re subscribed!
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {nextDate ? `Next newsletter: ${nextDate}` : 'Stay tuned.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">
                Plobie Newsletter
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Plant care tips, community highlights, and new arrivals.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending...' : 'Subscribe'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
