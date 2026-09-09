import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  PiggyBank,
  Receipt,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/common/PageHeader';
import Skeleton from '../../components/common/Skeleton';
import StatCard from '../../components/common/StatCard';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import CategorySalesChart from '../../components/charts/CategorySalesChart';
import TopProductsChart from '../../components/charts/TopProductsChart';
import PaymentMethodsChart from '../../components/charts/PaymentMethodsChart';
import RecentInvoicesTable from '../../components/dashboard/RecentInvoicesTable';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useAuth } from '../../context/AuthContext';
import {
  getCategorySales,
  getLowStockProducts,
  getPaymentDistribution,
  getRecentInvoices,
  getSalesData,
  getSummary,
  getTopProducts,
} from '../../services/dashboardService';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

/** Card-shaped skeleton placeholder for a summary StatCard. */
function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );
}

const SECTION_COUNT = 7;

/**
 * Dashboard module. All data comes from dashboardService (service layer only);
 * the page orchestrates loading / error / empty states and lays out the
 * summary cards, charts and tables responsively.
 */
export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [state, setState] = useState({
    loading: true,
    summary: null,
    salesData: null,
    topProducts: [],
    categorySales: [],
    paymentDistribution: [],
    recentInvoices: [],
    lowStockProducts: [],
    errors: [],
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    // Each section loads independently so one failing endpoint does not
    // blank out the whole dashboard.
    const results = await Promise.allSettled([
      getSummary(),
      getSalesData(),
      getTopProducts(),
      getCategorySales(),
      getPaymentDistribution(),
      getRecentInvoices(),
      getLowStockProducts(),
    ]);
    const value = (result, fallback) =>
      result.status === 'fulfilled' ? result.value : fallback;
    const message = (result) =>
      result.status === 'rejected'
        ? (result.reason && result.reason.message) ||
          'Failed to load dashboard data.'
        : null;

    setState((prev) => ({
      ...prev,
      loading: false,
      summary: value(results[0], null),
      salesData: value(results[1], null),
      topProducts: value(results[2], []),
      categorySales: value(results[3], []),
      paymentDistribution: value(results[4], []),
      recentInvoices: value(results[5], []),
      lowStockProducts: value(results[6], []),
      errors: results.map(message),
    }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const {
    loading,
    summary,
    salesData,
    topProducts,
    categorySales,
    paymentDistribution,
    recentInvoices,
    lowStockProducts,
    errors,
  } = state;

  const [
    summaryError,
    salesError,
    topProductsError,
    categoryError,
    paymentsError,
    invoicesError,
    lowStockError,
  ] = errors;
  const failedCount = errors.filter(Boolean).length;
  const allFailed = !loading && failedCount === SECTION_COUNT;

  const firstName =
    currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'there';

  const summaryCards = summary
    ? [
        {
          title: "Today's Sales",
          value: formatCurrency(summary.todaySales),
          icon: DollarSign,
          accent: 'brand',
          trend: summary.todaySalesTrend,
          trendLabel: 'vs yesterday',
        },
        {
          title: 'Total Sales',
          value: formatCurrency(summary.totalSales),
          icon: TrendingUp,
          accent: 'indigo',
          trendLabel: `${formatNumber(summary.totalBills)} invoices all time`,
        },
        {
          title: "Today's Bills",
          value: formatNumber(summary.todayBills),
          icon: Receipt,
          accent: 'brand',
          trend: summary.todayBillsTrend,
          trendLabel: 'vs yesterday',
        },
        {
          title: 'Total Customers',
          value: formatNumber(summary.totalCustomers),
          icon: Users,
          accent: 'emerald',
          trendLabel: 'registered customers',
        },
        {
          title: 'Total Products',
          value: formatNumber(summary.totalProducts),
          icon: Package,
          accent: 'indigo',
          trendLabel: 'in catalogue',
        },
        {
          title: 'Low Stock Products',
          value: formatNumber(summary.lowStockCount),
          icon: AlertTriangle,
          accent: summary.lowStockCount > 0 ? 'amber' : 'emerald',
          trendLabel: `at or below ${summary.lowStockThreshold} units`,
        },
        {
          title: 'Pending Payments',
          value: formatCurrency(summary.pendingPayments),
          icon: Clock,
          accent: 'amber',
          trendLabel: `${formatNumber(summary.pendingInvoices)} invoices outstanding`,
        },
        {
          title: 'Total Profit',
          value: formatCurrency(summary.totalProfit),
          icon: PiggyBank,
          accent: 'emerald',
          trendLabel: 'gross profit on sales',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}. Here is your store overview for ${formatDate(new Date())}.`}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={load}
          >
            Refresh
          </Button>
        }
      />

      {allFailed ? (
        /* Every section failed — most likely the API server is unreachable. */
        <Card>
          <ErrorState message={errors.find(Boolean)} onRetry={load} />
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>
          ) : (
            <Card>
              <ErrorState message={summaryError} onRetry={load} />
            </Card>
          )}

          {/* Sales trend + payment methods */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SalesTrendChart
                data={salesData}
                loading={loading}
                error={salesError}
                onRetry={load}
              />
            </div>
            <PaymentMethodsChart
              data={paymentDistribution}
              loading={loading}
              error={paymentsError}
              onRetry={load}
            />
          </div>

          {/* Category share + top products */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategorySalesChart
              data={categorySales}
              loading={loading}
              error={categoryError}
              onRetry={load}
            />
            <TopProductsChart
              data={topProducts}
              loading={loading}
              error={topProductsError}
              onRetry={load}
            />
          </div>

          {/* Recent invoices + low stock */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RecentInvoicesTable
                data={recentInvoices}
                loading={loading}
                error={invoicesError}
                onRetry={load}
              />
            </div>
            <LowStockTable
              data={lowStockProducts}
              loading={loading}
              error={lowStockError}
              onRetry={load}
            />
          </div>
        </>
      )}
    </div>
  );
}