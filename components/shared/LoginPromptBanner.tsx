import Link from 'next/link';

type LoginContext = 'play' | 'post' | 'interact' | 'general';

interface LoginPromptBannerProps {
  context: LoginContext;
  className?: string;
}

const contextMessages: Record<LoginContext, string> = {
  play: 'Log in to play and earn XP',
  post: 'Log in to create posts and join the conversation',
  interact: 'Log in to like, comment, and follow communities',
  general: 'Log in to get the full Plobie experience',
};

export default function LoginPromptBanner({ context, className = '' }: LoginPromptBannerProps) {
  return (
    <div
      className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-2 border-l-green-500 rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
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
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            {contextMessages[context]}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
            Join the Plobie community to unlock all features.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-medium rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
