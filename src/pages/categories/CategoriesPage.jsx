import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getCategories } from '../../services/categoryService';
import { formatDate, truncate } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'description', header: 'Description', render: (row) => truncate(row.description, 60) || '—' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
];

export default function CategoriesPage() {
  return (
    <ModuleIndexPage
      title="Categories"
      description="Organize products into categories for easier browsing and reporting."
      getData={getCategories}
      columns={COLUMNS}
      searchPlaceholder="Search categories…"
      defaultSort="name"
      defaultOrder="asc"
      emptyTitle="No categories yet"
      emptyDescription="Categories will appear here once you start organizing your catalogue."
    />
  );
}