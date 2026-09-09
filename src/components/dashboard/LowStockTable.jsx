import { Link } from 'react-router-dom';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import Skeleton from '../common/Skeleton';
import StatusBadge from '../common/StatusBadge';
import Table from '../common/Table';

const COLUMNS = [
  {
    key: 'name',
    header: 'Product',
    render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
  },
  { key: 'sku', header: 'SKU' },
  {
    key: 'stock',
    header: 'Current Stock',
    align: 'right',
    render: (row) => (
      <span
        className={`font-semibold ${row.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}
      >
        {row.stock}
      </span>
    ),
  },
  { key: 'minStock', header: 'Minimum Stock', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge
        status={row.stock === 0 ? 'error' : 'warning'}
        label={row.stock === 0 ? 'Out of stock' : 'Low stock'}
      />
    ),
  },
];

/**
 * Low stock products card for the dashboard. The minimum stock level comes
 * from store settings (settings.lowStockThreshold) via dashboardService.
 */
export default function LowStockTable({ data, loading, error, onRetry }) {
  return (
    <Card
      title="Low Stock Products"
      description="Items at or below the minimum stock level"
      actions={
        data && data.length > 0 && !loading && !error ? (
          <Link
            to="/inventory"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Manage stock
          </Link>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-10" count={4} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Inventory is healthy"
          description="No products are at or below the minimum stock level."
        />
      ) : (
        <Table columns={COLUMNS} data={data} />
      )}
    </Card>
  );
}