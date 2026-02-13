export default function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 mb-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-24 mb-2" />
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-lg w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-full" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-5/6" />
      </div>
      <div className="mt-4 flex items-center space-x-4">
        <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded-lg w-20" />
        <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded-lg w-24" />
      </div>
    </div>
  );
}
