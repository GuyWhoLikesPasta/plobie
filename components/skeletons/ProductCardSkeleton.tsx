export default function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse">
      <div className="h-64 bg-stone-200 dark:bg-stone-800" />
      <div className="p-4">
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-full mb-2" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-5/6 mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded-lg w-20" />
          <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}
