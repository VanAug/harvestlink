export default function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex rounded-xl bg-harvest-soft p-3 text-harvest-orange">
        <Icon size={22} />
      </div>
      <div className="text-3xl font-black text-harvest-green">{value ?? 0}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
