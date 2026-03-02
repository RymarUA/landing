/**
 * app/product/[id]/loading.tsx
 * Skeleton shown while a product page streams / hydrates.
 * Colors match the real page to avoid visual flash on load.
 */
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-3.5 w-16 bg-gray-200 rounded-full" />
          <div className="h-3 w-2 bg-gray-100 rounded-full" />
          <div className="h-3.5 w-20 bg-gray-200 rounded-full" />
          <div className="h-3 w-2 bg-gray-100 rounded-full" />
          <div className="h-3.5 w-40 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back link */}
        <div className="h-4 w-40 bg-gray-200 rounded-full mb-8" />

        {/* Main product card */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image placeholder */}
            <div className="h-80 md:min-h-[360px] bg-gray-100" />

            {/* Info */}
            <div className="p-8 flex flex-col gap-5">
              {/* Category + title */}
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-orange-100 rounded-full" />
                <div className="h-7 w-3/4 bg-gray-200 rounded-xl" />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-amber-100 rounded-sm" />
                  ))}
                </div>
                <div className="h-3.5 w-20 bg-gray-200 rounded-full" />
              </div>

              {/* Price */}
              <div className="h-10 w-40 bg-gray-200 rounded-xl" />

              {/* Description */}
              <div className="flex flex-col gap-2">
                <div className="h-3.5 w-full bg-gray-100 rounded-full" />
                <div className="h-3.5 w-5/6 bg-gray-100 rounded-full" />
                <div className="h-3.5 w-4/6 bg-gray-100 rounded-full" />
              </div>

              {/* Sizes */}
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-11 h-11 bg-rose-50 border-2 border-rose-100 rounded-xl" />
                ))}
              </div>

              {/* CTA buttons — use rose to match real page */}
              <div className="flex gap-3">
                <div className="h-14 flex-1 bg-rose-200 rounded-2xl" />
                <div className="h-14 flex-1 bg-rose-200 rounded-2xl" />
              </div>

              {/* Wishlist button */}
              <div className="h-12 w-full bg-gray-50 rounded-2xl border-2 border-gray-100" />

              {/* Delivery info */}
              <div className="h-16 w-full bg-blue-50 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Related products */}
        <div className="mt-14">
          <div className="h-7 w-48 bg-gray-200 rounded-xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-40 bg-gray-100" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-3 w-16 bg-gray-100 rounded-full" />
                  <div className="h-4 w-full bg-gray-200 rounded-full" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                  <div className="h-5 w-20 bg-rose-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
