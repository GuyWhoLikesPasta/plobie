export default function Loading() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors"
      role="status"
      aria-label="Loading"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
