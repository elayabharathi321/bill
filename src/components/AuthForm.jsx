import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthForm } from "../hooks/useAuthForm";
import Shell from "./Shell";

export default function AuthForm({ register = false }) {
  const { showPassword, togglePassword, submit } = useAuthForm();

  return (
    <Shell>
      <main className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> Smart billing platform
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
            {register
              ? "Start managing your business smarter."
              : "Welcome back to better billing."}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">
            {register
              ? "Create your BillPro account and simplify invoicing, GST billing, customers, payments, and reports."
              : "Login to manage your business billing and keep your cash flow moving."}
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-600">
            <span>
              <Check className="mr-2 inline text-emerald-600" size={16} />
              GST-ready invoices
            </span>
            <span>
              <Check className="mr-2 inline text-emerald-600" size={16} />
              Automated payment reminders
            </span>
            <span>
              <Check className="mr-2 inline text-emerald-600" size={16} />
              Simple business reports
            </span>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="rounded-3xl border border-ink/10 bg-white p-7 shadow-xl shadow-ink/5"
        >
          <h2 className="font-display text-2xl font-bold">
            {register ? "Create your account" : "Sign in to BillPro"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {register
              ? "Your billing workspace is a few details away."
              : "Enter your details to continue."}
          </p>
          {register && (
            <label className="mt-6 block text-sm font-bold">
              Full name
              <input required className="field" placeholder="Your name" />
            </label>
          )}
          <label className="mt-6 block text-sm font-bold">
            Email address
            <input
              required
              type="email"
              className="field"
              placeholder="you@company.com"
            />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Password
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                className="field pr-16"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-3 text-xs font-bold text-coral"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <button className="mt-6 w-full rounded-xl bg-ink py-3.5 font-bold text-white">
            {register ? "Create account" : "Sign in"}{" "}
            <ArrowRight className="ml-1 inline size-4" />
          </button>
          <p className="mt-5 text-center text-sm text-slate-500">
            {register ? "Already have an account? " : "New to BillPro? "}
            <Link
              className="font-bold text-coral"
              to={register ? "/login" : "/register"}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </main>
    </Shell>
  );
}
