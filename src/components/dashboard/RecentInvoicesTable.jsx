import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import Skeleton from '../common/Skeleton';
import StatusBadge from '../common/StatusBadge';
import Table from '../common/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';

const COLUMNS = [
  {
    key: 'invoiceNumber',
    header: 'Invoice #',
    render: (row) => <span className="font-medium text-gray-900">{row.invoiceNumber}</span>,
  },
  { key: 'customerName', header: 'Customer' },
  { key: 'invoiceDate', header: 'Date', render: (row) => formatDate(row.invoiceDate) },
  {
    key: 'totalAmount',
    header: 'Amount',
    align: 'right',
    render: (row) => (
      <span className="font-medium text-gray-900">{formatCurrency(row.totalAmount)}</span>
    ),
  },
  { key: 'status', header: 'Payment Status', render: (row) => <StatusBadge status={row.status} /> },
];

/**
 * Recent invoices card for the dashboard.
 */
export default function RecentInvoicesTable({ data, loading, error, onRetry }) {
  return (
    <Card
      title="Recent Invoices"
      description="Latest bills raised at the counter"
      actions={
        <Link
          to="/invoices"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View all
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-10" count={5} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Invoices created in Billing / POS will appear here."
        />
      ) : (
        <Table
          columns={COLUMNS}
          data={data}
          actions={(row) => (
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
              title={`Open ${row.invoiceNumber} in the Invoices module`}
            >
              <Eye className="h-4 w-4" />
              View
            </Link>
          )}
        />
      )}
    </Card>
  );
}