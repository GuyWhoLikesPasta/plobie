import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 transition-colors"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-stone-400 dark:text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h1
          id="not-found-title"
          className="text-6xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight"
        >
          404
        </h1>
        <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mb-3 tracking-tight">
          Page Not Found
        </h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[48px] bg-green-600 text-white rounded-xl font-medium hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
