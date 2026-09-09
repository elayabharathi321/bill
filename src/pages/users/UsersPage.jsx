import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getUsers } from '../../services/userService';
import { capitalize } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (row) => capitalize(row.role) },
  { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

export default function UsersPage() {
  return (
    <ModuleIndexPage
      title="Users"
      description="Manage user accounts, roles and access permissions."
      getData={getUsers}
      columns={COLUMNS}
      searchPlaceholder="Search users…"
      defaultSort="name"
      defaultOrder="asc"
      emptyTitle="No users yet"
      emptyDescription="User accounts will appear here once they are created."
    />
  );
}