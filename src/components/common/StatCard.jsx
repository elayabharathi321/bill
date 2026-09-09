import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/**
 * Dashboard statistic card.
 */
export default function StatCard({ title, value, icon: Icon, trend, trendLabel, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  const isPositive = (trend ?? 0) >= 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          {(trend !== undefined || trendLabel) && (
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              {trend !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium
                    ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
              {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}