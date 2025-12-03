export default function ProfileCardSkeleton() {
  return (
    <div className="glass-strong p-8 md:p-10 rounded-3xl shadow-2xl mb-10 animate-pulse border border-white/10">
      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
        <div className="w-32 h-32 bg-white/10 rounded-3xl"></div>
        <div className="flex-1 w-full">
          <div className="space-y-4">
            <div className="h-8 bg-white/10 rounded-lg w-48"></div>
            <div className="flex gap-3">
              <div className="h-8 bg-white/10 rounded-xl w-24"></div>
              <div className="h-8 bg-white/10 rounded-xl w-24"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
            <div className="glass p-4 rounded-xl">
              <div className="h-8 bg-white/10 rounded w-12 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="h-8 bg-white/10 rounded w-12 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="h-8 bg-white/10 rounded w-12 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="h-8 bg-white/10 rounded w-12 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

