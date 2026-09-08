import Shell from "../components/Shell";
import { revenueBars, stats } from "../utils/appData";

export default function DashboardPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Overview</span>
            <h1 className="mt-3 font-display text-4xl font-bold">
              Good morning, Admin...
            </h1>
            <p className="mt-2 text-slate-500">
              Here is what's happening with your billing today.
            </p>
          </div>
          <button className="rounded-xl bg-coral px-4 py-3 font-bold text-white">
            + Create invoice
          </button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {stats.map(([value, label, change]) => (
            <div
              className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
              key={label}
            >
              <p className="text-sm text-slate-500">{label}</p>
              <strong className="mt-2 block font-display text-3xl">
                {value}
              </strong>
              <span className="text-xs font-bold text-emerald-600">
                {change} this month
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Revenue overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly revenue performance
          </p>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-l border-ink/10 px-4">
            {revenueBars.map((height) => (
              <span
                key={height}
                style={{ height: `${height}%` }}
                className="flex-1 rounded-t-lg bg-coral/80 transition-all hover:bg-coral"
              />
            ))}
          </div>
        </div>
      </main>
    </Shell>
  );
}
