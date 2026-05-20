export default function SkeletonCard({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-green-900/10 bg-white p-5 shadow-sm animate-pulse">
          <div className="mb-4 h-40 w-full rounded-2xl bg-gray-200" />
          <div className="mb-2 h-5 w-3/4 rounded-full bg-gray-200" />
          <div className="mb-1 h-4 w-1/2 rounded-full bg-gray-200" />
          <div className="mt-4 flex gap-2">
            <div className="h-4 w-1/3 rounded-full bg-gray-200" />
            <div className="h-4 w-1/4 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-2xl bg-gray-200" />
            <div className="h-12 rounded-2xl bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}