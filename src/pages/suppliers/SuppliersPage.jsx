import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getSuppliers } from '../../services/supplierService';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'contactPerson', header: 'Contact', render: (row) => row.contactPerson || '—' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

export default function SuppliersPage() {
  return (
    <ModuleIndexPage
      title="Suppliers"
      description="Manage supplier information and purchase relationships."
      getData={getSuppliers}
      columns={COLUMNS}
      searchPlaceholder="Search suppliers…"
      defaultSort="name"
      defaultOrder="asc"
      emptyTitle="No suppliers yet"
      emptyDescription="Suppliers will appear here once you add your first business partner."
    />
  );
}