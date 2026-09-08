import { BarChart3, CircleHelp, ShieldCheck } from "lucide-react";
import Feature from "../components/Feature";
import Shell from "../components/Shell";

export default function InfoPage({
  title,
  eyebrow,
  body,
  icon = <CircleHelp />,
}) {
  return (
    <Shell>
      <main className="mx-auto max-w-5xl px-5 py-24">
        <span className="eyebrow">
          {icon} {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-tight">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
          {body}
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          <Feature
            icon={<ShieldCheck />}
            title="Clear workflows"
            text="Everything is designed to help your team move from task to task with less friction."
          />
          <Feature
            icon={<BarChart3 />}
            title="Useful insight"
            text="Turn everyday billing activity into a clearer picture of business performance."
          />
        </div>
      </main>
    </Shell>
  );
}
