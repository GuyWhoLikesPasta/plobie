import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6" role="img" aria-label="Plant seedling">
          🌱
        </div>
        <h1 id="not-found-title" className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[48px] bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
