import { Link } from "react-router-dom";

export default function DashboardHero({ eyebrow, title, description, actions = [], children }) {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-harvest-green to-green-800 p-8 text-white shadow-soft">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{eyebrow}</div>
          <h1 className="mt-4 text-4xl font-black">{title}</h1>
          <p className="mt-2 max-w-3xl text-white/80">{description}</p>
          {children}
        </div>
      </div>
      {actions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map(({ label, to, icon: Icon, primary }) => (
            <Link
              key={label}
              to={to}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white ${primary ? "bg-harvest-orange hover:bg-orange-600" : "bg-white/10 hover:bg-white/20"}`}
            >
              {Icon && <Icon size={16} />}
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
