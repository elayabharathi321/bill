import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import Skeleton from '../common/Skeleton';

/**
 * Shared wrapper for dashboard chart cards. Renders the card chrome plus
 * consistent loading (skeleton), error and empty states around the chart.
 */
export default function ChartCard({
  title,
  description,
  actions,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No data yet',
  emptyDescription,
  chartHeight = 'h-72',
  children,
}) {
  return (
    <Card title={title} description={description} actions={actions}>
      {loading ? (
        <Skeleton className={`w-full ${chartHeight}`} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        children
      )}
    </Card>
  );
}