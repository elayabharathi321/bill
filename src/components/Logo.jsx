import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-ink text-white shadow-lg shadow-ink/15">
        B
      </span>
      <span>
        Bill<span className="text-coral">Pro</span>
      </span>
    </Link>
  );
}
