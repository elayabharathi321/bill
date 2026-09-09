import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS } from '../../utils/constants';
import { formatCompactCurrency, formatCurrency, formatNumber } from '../../utils/formatters';

function TopProductTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{entry.name}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(entry.revenue)}
      </p>
      <p className="text-xs text-gray-500">{formatNumber(entry.unitsSold)} units sold</p>
    </div>
  );
}

/**
 * Top selling products, rendered as horizontal revenue bars.
 */
export default function TopProductsChart({ data, loading, error, onRetry }) {
  return (
    <ChartCard
      title="Top Selling Products"
      description="Best performers by revenue"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={!data || data.length === 0}
      emptyTitle="No product sales yet"
      emptyDescription="Product performance will appear here once invoices are created."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCompactCurrency(value)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={132}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<TopProductTooltip />}
              cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }}
            />
            <Bar
              dataKey="revenue"
              fill={CHART_COLORS[0]}
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}