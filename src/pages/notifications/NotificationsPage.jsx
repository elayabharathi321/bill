import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import StatusBadge from '../../components/common/StatusBadge';
import { getNotifications } from '../../services/notificationService';
import { formatDateTime, truncate } from '../../utils/formatters';

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: 'Title' },
  { key: 'message', header: 'Message', render: (row) => truncate(row.message, 60) },
  { key: 'type', header: 'Type', render: (row) => <StatusBadge status={row.type} label={row.type} /> },
  {
    key: 'isRead',
    header: 'Status',
    render: (row) => (
      <StatusBadge status={row.isRead ? 'success' : 'warning'} label={row.isRead ? 'Read' : 'Unread'} />
    ),
  },
  { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
];

const NOTIFICATION_FILTERS = [
  { key: 'type', label: 'Type', placeholder: 'All types', options: ['warning', 'success', 'error', 'info'] },
  { key: 'isRead', label: 'Read', placeholder: 'All', options: [{ value: 'false', label: 'Unread' }, { value: 'true', label: 'Read' }] },
];

export default function NotificationsPage() {
  return (
    <ModuleIndexPage
      title="Notifications"
      description="View alerts for low stock, overdue invoices and system events."
      getData={getNotifications}
      columns={COLUMNS}
      filters={NOTIFICATION_FILTERS}
      searchPlaceholder="Search notifications…"
      defaultSort="createdAt"
      defaultOrder="desc"
      emptyTitle="No notifications"
      emptyDescription="System alerts and reminders will appear here."
    />
  );
}