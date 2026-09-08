import { ArrowRight, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo";
import { navItems } from "../utils/appData";

export default function Header() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="relative z-20 mx-auto mt-5 flex w-[min(1180px,92%)] items-center justify-between rounded-2xl border border-ink/10 bg-white/85 px-5 py-3 shadow-sm backdrop-blur-md">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex">
        {navItems.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive ? "text-ink" : "hover:text-coral"
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <Link to="/login" className="px-3 py-2 text-sm font-bold text-ink">
          Login
        </Link>
        <Link
          to="/register"
          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-coral/20"
        >
          Get started <ArrowRight className="ml-1 inline size-4" />
        </Link>
      </div>
      <button
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav className="absolute left-0 right-0 top-16 grid gap-2 rounded-2xl border border-ink/10 bg-white p-4 shadow-xl md:hidden">
          {navItems.map(([label, path]) => (
            <Link
              onClick={closeMenu}
              key={path}
              to={path}
              className="rounded-lg px-3 py-2 font-semibold hover:bg-mist"
            >
              {label}
            </Link>
          ))}
          <Link
            onClick={closeMenu}
            to="/login"
            className="rounded-lg px-3 py-2 font-semibold"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  );
}
