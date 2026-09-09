import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getPurchases } from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'invoiceNumber', header: 'PO Ref' },
  {
    key: 'supplier',
    header: 'Supplier',
    render: (row) => row.supplier?.name || (row.supplierId ? `#${row.supplierId}` : '—'),
  },
  { key: 'purchaseDate', header: 'Date', render: (row) => formatDate(row.purchaseDate) },
  { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

const BASE_PARAMS = { _expand: 'supplier' };

export default function PurchasesPage() {
  return (
    <ModuleIndexPage
      title="Purchases"
      description="Record purchase orders and stock incoming from suppliers."
      getData={getPurchases}
      columns={COLUMNS}
      baseParams={BASE_PARAMS}
      searchPlaceholder="Search purchases…"
      defaultSort="purchaseDate"
      defaultOrder="desc"
      emptyTitle="No purchases yet"
      emptyDescription="Purchase orders raised to suppliers will be tracked here."
    />
  );
}