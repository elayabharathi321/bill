import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from './ChartCard';
import Select from '../common/Select';
import Tabs from '../common/Tabs';
import { CHART_COLORS } from '../../utils/constants';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';

const GRANULARITY_TABS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'This year' },
  { value: 'all', label: 'All time' },
];

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local-date key of the first day included in the selected range. */
function rangeCutoffKey(range) {
  if (range === 'all') return null;
  const now = new Date();
  if (range === 'ytd') return `${now.getFullYear()}-01-01`;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  return toLocalDateKey(cutoff);
}

function SalesTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{point.fullLabel}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(point.sales)}
      </p>
      <p className="text-xs text-gray-500">
        {point.bills} {point.bills === 1 ? 'bill' : 'bills'}
      </p>
    </div>
  );
}

/**
 * Main sales trend chart. Daily / weekly / monthly granularity plus a
 * practical date-range filter, all computed from data already provided by
 * dashboardService (no refetching when switching views).
 */
export default function SalesTrendChart({ data, loading, error, onRetry }) {
  const [granularity, setGranularity] = useState('daily');
  const [range, setRange] = useState('30d');

  const series = useMemo(() => {
    const points = (data && data[granularity]) || [];
    const cutoff = rangeCutoffKey(range);
    return cutoff ? points.filter((point) => point.date >= cutoff) : points;
  }, [data, granularity, range]);

  return (
    <ChartCard
      title="Sales Overview"
      description="Revenue trend for the selected period"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={!series.length}
      emptyTitle="No sales data yet"
      emptyDescription="Revenue will appear here once invoices are created."
      actions={
        <>
          <Tabs
            tabs={GRANULARITY_TABS}
            active={granularity}
            onChange={setGranularity}
          />
          <div className="w-36">
            <Select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              options={RANGE_OPTIONS}
              aria-label="Date range"
            />
          </div>
        </>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={52}
            />
            <Tooltip
              content={<SalesTooltip />}
              cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              fill="url(#salesAreaGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}