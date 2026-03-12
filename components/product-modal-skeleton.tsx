export function ProductModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="aspect-square bg-gray-200 animate-pulse" />
          <div className="absolute top-4 right-4 w-10 h-10 bg-gray-300 animate-pulse rounded-full" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4" />
          <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
          <div className="h-20 bg-gray-200 animate-pulse rounded" />
          <div className="h-12 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
