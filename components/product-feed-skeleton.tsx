export function ProductFeedSkeleton() {
  return (
    <div className="mt-14">
      <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="h-44 bg-gray-200 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-4 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
              <div className="h-5 bg-gray-200 animate-pulse rounded w-2/3 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
