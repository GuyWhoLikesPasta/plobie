export default function ProfileCardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-20 h-20 bg-stone-200 dark:bg-stone-700 rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-lg w-32 mb-2" />
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-48" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map(i => (
          <div key={i}>
            <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded-lg w-12 mb-2" />
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-full" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-5/6" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-4/6" />
      </div>
    </div>
  );
}
