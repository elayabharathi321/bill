import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

function PaymentTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{entry.name}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(entry.value)}
      </p>
      <p className="text-xs text-gray-500">
        {entry.count} {entry.count === 1 ? 'payment' : 'payments'}
      </p>
    </div>
  );
}

/**
 * Payment method distribution donut chart.
 */
export default function PaymentMethodsChart({ data, loading, error, onRetry }) {
  const chartData = (data || []).map((entry) => ({
    name: entry.label,
    value: entry.total,
    count: entry.count,
  }));

  return (
    <ChartCard
      title="Payment Methods"
      description="How customers are paying"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={chartData.length === 0}
      emptyTitle="No payments yet"
      emptyDescription="Payment methods will appear here once payments are recorded."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={2}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<PaymentTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}