export default function PostCardSkeleton() {
  return (
    <div className="glass-strong p-6 rounded-3xl shadow-lg mb-6 animate-pulse border border-white/10">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-white/10 rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded-lg w-32"></div>
          <div className="h-3 bg-white/10 rounded-lg w-40"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-white/10 rounded-lg w-3/4"></div>
        <div className="h-4 bg-white/10 rounded-lg w-full"></div>
        <div className="h-4 bg-white/10 rounded-lg w-5/6"></div>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-10 bg-white/10 rounded-xl w-24"></div>
        <div className="h-10 bg-white/10 rounded-xl w-28"></div>
      </div>
    </div>
  );
}

