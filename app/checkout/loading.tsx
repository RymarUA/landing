/**
 * app/checkout/loading.tsx
 * Skeleton shown while the checkout page hydrates / lazy-loads.
 */
export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 animate-pulse">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <div className="h-4 w-36 bg-gray-200 rounded-full mb-6" />

        {/* Title */}
        <div className="h-9 w-72 bg-gray-200 rounded-2xl mb-8" />

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: form skeleton ── */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Contact card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
              <div className="h-5 w-44 bg-gray-200 rounded-full" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3.5 w-28 bg-gray-200 rounded-full" />
                  <div className="h-11 w-full bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>

            {/* Delivery card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
              <div className="h-5 w-52 bg-gray-200 rounded-full" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3.5 w-24 bg-gray-200 rounded-full" />
                  <div className="h-11 w-full bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>

            {/* Submit button */}
            <div className="h-14 w-full bg-rose-200 rounded-2xl" />
          </div>

          {/* ── Right: order summary skeleton ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="h-5 w-36 bg-gray-200 rounded-full mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 w-3/4 bg-gray-200 rounded-full" />
                    <div className="h-3 w-1/4 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="h-6 w-32 bg-gray-200 rounded-full ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
