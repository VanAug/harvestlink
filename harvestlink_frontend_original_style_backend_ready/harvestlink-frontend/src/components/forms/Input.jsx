export function Input({ label, textarea, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-800">{label}</span>
      {textarea ? (
        <textarea {...props} className="min-h-28 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf" />
      ) : (
        <input {...props} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf" />
      )}
    </label>
  );
}

export function Select({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-800">{label}</span>
      <select className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf">{children}</select>
    </label>
  );
}
