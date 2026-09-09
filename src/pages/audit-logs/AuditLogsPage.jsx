import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getAuditLogs } from '../../services/auditLogService';
import { capitalize, formatDateTime, truncate } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'action', header: 'Action' },
  { key: 'module', header: 'Module', render: (row) => capitalize(row.module) },
  { key: 'description', header: 'Description', render: (row) => truncate(row.description, 50) },
  { key: 'user', header: 'User', render: (row) => row.user?.name || (row.userId ? `#${row.userId}` : '—') },
  { key: 'ipAddress', header: 'IP', render: (row) => row.ipAddress || '—' },
  { key: 'createdAt', header: 'Time', render: (row) => formatDateTime(row.createdAt) },
];

const BASE_PARAMS = { _expand: 'user' };

export default function AuditLogsPage() {
  return (
    <ModuleIndexPage
      title="Audit Logs"
      description="Review a chronological trail of system and user activities."
      getData={getAuditLogs}
      columns={COLUMNS}
      baseParams={BASE_PARAMS}
      searchPlaceholder="Search audit logs…"
      defaultSort="createdAt"
      defaultOrder="desc"
      emptyTitle="No audit activity yet"
      emptyDescription="System and user actions will be recorded here."
    />
  );
}