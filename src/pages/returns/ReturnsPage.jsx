import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getReturns } from '../../services/returnService';
import { formatCurrency, formatDate, truncate } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'returnNumber', header: 'Return' },
  {
    key: 'customer',
    header: 'Customer',
    render: (row) => row.customer?.name || (row.customerId ? `#${row.customerId}` : '—'),
  },
  { key: 'returnDate', header: 'Date', render: (row) => formatDate(row.returnDate) },
  { key: 'reason', header: 'Reason', render: (row) => truncate(row.reason, 40) || '—' },
  { key: 'totalRefund', header: 'Refund', align: 'right', render: (row) => formatCurrency(row.totalRefund) },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

const BASE_PARAMS = { _expand: 'customer' };

export default function ReturnsPage() {
  return (
    <ModuleIndexPage
      title="Returns"
      description="Process product returns, refunds and restocking."
      getData={getReturns}
      columns={COLUMNS}
      baseParams={BASE_PARAMS}
      searchPlaceholder="Search returns…"
      defaultSort="returnDate"
      defaultOrder="desc"
      emptyTitle="No returns yet"
      emptyDescription="Product returns and refunds will be recorded here."
    />
  );
}