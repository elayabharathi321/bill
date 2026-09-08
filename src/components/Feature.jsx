export default function Feature({ icon, title, text }) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <span className="mb-5 grid size-11 place-items-center rounded-xl bg-coral/10 text-coral">
        {icon}
      </span>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-500">{text}</p>
    </article>
  );
}
