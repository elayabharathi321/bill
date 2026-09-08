import { Check } from "lucide-react";
import { previewBars, stats } from "../utils/appData";

export default function DashboardPreview() {
  return (
    <div className="relative animate-float">
      <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-2xl shadow-ink/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Performance overview
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">
              Revenue dashboard
            </h2>
          </div>
          <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-emerald-700">
            Live
          </span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {stats.slice(0, 2).map(([value, label, change]) => (
            <div key={label} className="rounded-2xl bg-mist p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <strong className="mt-2 block font-display text-2xl">
                {value}
              </strong>
              <span className="text-xs font-bold text-emerald-600">
                {change}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex h-36 items-end gap-3 rounded-2xl bg-ink p-5">
          {previewBars.map((height, index) => (
            <span
              key={height}
              style={{ height: `${height}%` }}
              className={`flex-1 rounded-t-md ${index === previewBars.length - 1 ? "bg-coral" : "bg-white/25"}`}
            />
          ))}
        </div>
      </div>
      <div className="absolute -bottom-5 -left-6 rounded-2xl border border-ink/10 bg-white p-3 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-mint text-emerald-700">
            <Check size={18} />
          </span>
          <div>
            <strong className="block text-sm">Invoice paid</strong>
            <span className="text-xs text-slate-500">₹24,500 received</span>
          </div>
        </div>
      </div>
    </div>
  );
}
