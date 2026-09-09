import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{entry.name}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(entry.revenue)}
      </p>
      <p className="text-xs text-gray-500">
        {entry.percentage}% of sales · {entry.units} units
      </p>
    </div>
  );
}

/**
 * Sales by category donut chart.
 */
export default function CategorySalesChart({ data, loading, error, onRetry }) {
  return (
    <ChartCard
      title="Sales by Category"
      description="Revenue share per product category"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={!data || data.length === 0}
      emptyTitle="No category sales yet"
      emptyDescription="Category revenue will appear here once invoices are created."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={2}
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}