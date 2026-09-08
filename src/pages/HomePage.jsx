import { BarChart3, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import DashboardPreview from "../components/DashboardPreview";
import Feature from "../components/Feature";
import Shell from "../components/Shell";
import { stats } from "../utils/appData";

export default function HomePage() {
  return (
    <Shell>
      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-20">
        <section className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div className="animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-coral">
              <span className="size-2 rounded-full bg-coral" /> Built for modern
              finance teams
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
              Turn billing into{" "}
              <span className="text-coral">your growth engine.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
              From invoice creation to payment follow-ups, BillPro helps growing
              businesses streamline billing, improve cash flow, and deliver a
              better customer experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <RouterLink
                to="/register"
                className="rounded-xl bg-ink px-5 py-3.5 font-bold text-white shadow-xl shadow-ink/15"
              >
                Get started <ArrowRight className="ml-2 inline size-4" />
              </RouterLink>
              <a
                href="#features"
                className="rounded-xl border border-ink/15 bg-white px-5 py-3.5 font-bold"
              >
                Explore platform
              </a>
            </div>
            <div className="mt-9 flex gap-6 text-xs font-bold text-slate-500">
              <span>48h invoice cycle</span>
              <span>Auto GST</span>
              <span>Live reminders</span>
            </div>
          </div>
          <DashboardPreview />
        </section>
        <section className="mt-24 grid gap-4 border-y border-ink/10 py-8 sm:grid-cols-3">
          {stats.map(([value, label, change]) => (
            <div key={label} className="flex items-end justify-between px-2">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <strong className="font-display text-3xl">{value}</strong>
              </div>
              <span className="rounded-full bg-mint px-2 py-1 text-xs font-bold text-emerald-700">
                {change}
              </span>
            </div>
          ))}
        </section>
        <section id="features" className="grid gap-6 py-24 sm:grid-cols-3">
          <Feature
            icon={<FileText />}
            title="Effortless invoicing"
            text="Create polished, GST-ready invoices in seconds and keep every document in one place."
          />
          <Feature
            icon={<BarChart3 />}
            title="Clearer cash flow"
            text="See revenue, payment status, and business performance without spreadsheet sprawl."
          />
          <Feature
            icon={<ShieldCheck />}
            title="Built for trust"
            text="Reliable workflows and secure access help your team operate with confidence."
          />
        </section>
      </main>
    </Shell>
  );
}
