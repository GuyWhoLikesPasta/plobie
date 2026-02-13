export default function Loading() {
  return (
    <div
      className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors"
      role="status"
      aria-label="Loading"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-stone-200 dark:border-stone-800 border-t-green-600 dark:border-t-green-400 mx-auto mb-4" />
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
