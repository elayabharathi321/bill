import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  History,
  MoreVertical,
  Package,
  PackageX,
  Plus,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Dropdown from '../../components/common/Dropdown';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Skeleton from '../../components/common/Skeleton';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import {
  adjustStock,
  getInventory,
} from '../../services/inventoryService';
import {
  STOCK_STATUS_FILTER_OPTIONS,
  DEFAULT_PAGE_SIZE,
} from '../../utils/constants';
import { useDebounce } from '../../hooks';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentModal';
import TransactionHistoryModal from '../../components/inventory/TransactionHistoryModal';

/**
 * Render the current stock quantity with a colour-coded badge.
 */
function stockCell(row) {
  const qty = Number(row.stockQuantity) || 0;
  const min = Number(row.minimumStock) || 0;
  const isOut = qty === 0;
  const isLow = !isOut && qty <= min;

  const color = isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600';
  const badgeStatus = isOut ? 'error' : isLow ? 'warning' : 'success';
  const badgeLabel = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock';

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className={`font-medium ${color}`}>{formatNumber(qty)}</span>
      <StatusBadge status={badgeStatus} label={badgeLabel} />
    </div>
  );
}

// Stable column definitions (read `row.category` from `_expand` in the service).
const COLUMNS = [
  {
    key: 'name',
    header: 'Product',
    render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
    ),
  },
  { key: 'sku', header: 'SKU' },
  {
    key: 'category',
    header: 'Category',
    render: (row) =>
      row.category?.name || (row.categoryId ? `#${row.categoryId}` : '—'),
  },
  {
    key: 'stockQuantity',
    header: 'Current Stock',
    align: 'right',
    render: (row) => stockCell(row),
  },
  {
    key: 'minimumStock',
    header: 'Minimum Stock',
    align: 'right',
    render: (row) => formatNumber(Number(row.minimumStock) || 0),
  },
  {
    key: 'stockStatus',
    header: 'Stock Status',
    render: (row) => <StatusBadge status={row.stockStatus} />,
  },
  {
    key: 'updatedAt',
    header: 'Last Updated',
    render: (row) => formatDate(row.updatedAt),
  },
];

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', value: 'name', order: 'asc' },
  { label: 'Name (Z-A)', value: 'name', order: 'desc' },
  { label: 'SKU (A-Z)', value: 'sku', order: 'asc' },
  { label: 'SKU (Z-A)', value: 'sku', order: 'desc' },
  { label: 'Stock (low to high)', value: 'stockQuantity', order: 'asc' },
  { label: 'Stock (high to low)', value: 'stockQuantity', order: 'desc' },
  { label: 'Category (A-Z)', value: 'categoryId', order: 'asc' },
  { label: 'Stock Status', value: 'stockStatus', order: 'asc' },
  { label: 'Newest first', value: 'updatedAt', order: 'desc' },
  { label: 'Oldest first', value: 'updatedAt', order: 'asc' },
];

/**
 * Inventory module — full dashboard + stock management page.
 *
 * Data flows entirely through the service layer (inventoryService):
 *   - getInventory()  → products enriched with computed stock fields + summary KPIs
 *   - adjustStock()   → creates a transaction and updates product stock atomically
 *   - getInventoryTransactions() → transaction history (used by the history modal)
 *
 * Search, filter, sort and pagination are handled client-side because
 * getInventory() returns the full catalogue (inventory sets are typically small).
 * When Spring Boot is introduced, dedicated endpoints can replace the service
 * functions without changing this page — all calculation logic stays in the
 * service / utility layer.
 */
export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);

  const debouncedSearch = useDebounce(search, 300);
  const { currentUser } = useAuth();
  const toast = useToast();

  // Fetch the full catalogue + summary.
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getInventory()
      .then((result) => {
        setProducts(result.products || []);
        setSummary(result.summary || null);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load inventory.');
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Jump back to page 1 when search or filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterValues]);

  // Category options derived from the loaded catalogue.
  const categoryOptions = useMemo(() => {
    const seen = {};
    products.forEach((p) => {
      if (p.category && p.category.id && !seen[p.category.id]) {
        seen[p.category.id] = p.category.name;
      }
    });
    return Object.entries(seen).map(([id, name]) => ({
      value: Number(id),
      label: name,
    }));
  }, [products]);

  // Client-side search + filter + sort.
  const filteredProducts = useMemo(() => {
    let result = products;

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.sku || '').toLowerCase().includes(query) ||
          (p.barcode || '').toLowerCase().includes(query)
      );
    }

    if (filterValues.stockStatus) {
      result = result.filter((p) => p.stockStatus === filterValues.stockStatus);
    }

    if (filterValues.categoryId) {
      result = result.filter(
        (p) => p.categoryId === Number(filterValues.categoryId)
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null) return -1;
      if (bVal == null) return 1;
      if (typeof aVal === 'string' || typeof bVal === 'string') {
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [products, debouncedSearch, filterValues, sortBy, sortOrder]);

  // Client-side pagination.
  const total = filteredProducts.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + pageSize
  );

  /* ---------------------------------------------------------------- */
  /* Header / modal actions                                           */
  /* ---------------------------------------------------------------- */

  const openAdjustment = () => {
    setAdjustmentProduct(null);
    setAdjustmentOpen(true);
  };

  const openAdjustmentForProduct = (row) => {
    setAdjustmentProduct(row);
    setAdjustmentOpen(true);
  };

  const openHistory = (row) => {
    setHistoryProduct(row);
    setHistoryOpen(true);
  };

  const closeAdjustment = () => {
    setAdjustmentOpen(false);
    setAdjustmentProduct(null);
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryProduct(null);
  };

  const handleAdjustmentSave = async (data) => {
    try {
      await adjustStock(data.productId, data.type, data.quantity, {
        reason: data.reason,
        referenceType: 'manual',
        createdBy: currentUser?.id,
      });
      toast.success('Stock adjusted successfully.');
      closeAdjustment();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to adjust stock.');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  const hasQuery = Boolean(debouncedSearch.trim());
  const isFiltered =
    hasQuery ||
    Object.values(filterValues).some((v) => v !== undefined && v !== '');

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          subtitle="Track stock levels, adjustments and low-stock alerts."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={History}
                onClick={() => setHistoryOpen(true)}
              >
                Transactions
              </Button>
              <Button icon={Plus} onClick={openAdjustment}>
                Adjust Stock
              </Button>
            </div>
          }
        />

        {/* Dashboard summary cards */}
        {loading || !summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <div className="space-y-2.5 p-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Products"
              value={formatNumber(summary.totalProducts)}
              icon={Package}
              accent="indigo"
              trendLabel="in catalogue"
            />
            <StatCard
              title="Total Stock Units"
              value={formatNumber(summary.totalStockUnits)}
              icon={Boxes}
              accent="brand"
              trendLabel="across all products"
            />
            <StatCard
              title="Low Stock"
              value={formatNumber(summary.lowStock)}
              icon={AlertTriangle}
              accent={summary.lowStock > 0 ? 'amber' : 'emerald'}
              trendLabel={`at or below minimum`}
            />
            <StatCard
              title="Out of Stock"
              value={formatNumber(summary.outOfStock)}
              icon={PackageX}
              accent={summary.outOfStock > 0 ? 'red' : 'emerald'}
              trendLabel="zero inventory"
            />
            <StatCard
              title="Stock Value"
              value={formatCurrency(summary.stockValue)}
              icon={DollarSign}
              accent="emerald"
              trendLabel="total cost value"
            />
          </div>
        )}

        {/* Inventory table */}
        <Card>
          {/* Filters / Actions */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/40 px-4 py-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search products…"
              className="w-full sm:w-72"
            />
            <div className="flex-1" />
            <div className="w-44">
              <Select
                value={filterValues.stockStatus || ''}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    stockStatus: e.target.value || undefined,
                  }))
                }
                placeholder="All status"
                options={STOCK_STATUS_FILTER_OPTIONS}
                aria-label="Filter by stock status"
              />
            </div>
            <div className="w-44">
              <Select
                value={filterValues.categoryId || ''}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    categoryId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="All categories"
                options={categoryOptions}
                aria-label="Filter by category"
              />
            </div>
          </div>

          {/* Table / loading / error / empty */}
          {loading ? (
            <div className="space-y-2.5 p-4">
              <Skeleton className="h-11" count={8} />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-gray-500">
                {isFiltered ? 'No matches' : 'No products in inventory'}
              </p>
              {isFiltered && (
                <p className="mt-1 text-sm text-gray-400">
                  {hasQuery
                    ? `Nothing matches your search for “${debouncedSearch}”.`
                    : 'Try adjusting the filters.'}
                </p>
              )}
            </div>
          ) : (
            <>
              <Table
                columns={COLUMNS}
                data={paginatedProducts}
                actions={(row) => (
                  <Dropdown
                    align="right"
                    trigger={
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                    items={[
                      {
                        label: 'Adjust Stock',
                        onClick: () => openAdjustmentForProduct(row),
                      },
                      {
                        label: 'View History',
                        onClick: () => openHistory(row),
                      },
                    ]}
                  />
                )}
                actionHeader="Actions"
              />
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      </div>

      {/* Stock adjustment form */}
      <Modal
        open={adjustmentOpen}
        onClose={closeAdjustment}
        title={
          adjustmentProduct
            ? `Adjust Stock: ${adjustmentProduct.name}`
            : 'Adjust Stock'
        }
        description="Add or remove stock and record the adjustment."
        size="lg"
      >
        {adjustmentOpen && (
          <StockAdjustmentForm
            key={adjustmentProduct?.id || 'new'}
            product={adjustmentProduct}
            products={products}
            onSave={handleAdjustmentSave}
            onCancel={closeAdjustment}
            submitLabel="Apply Adjustment"
          />
        )}
      </Modal>

      {/* Transaction history modal */}
      <TransactionHistoryModal
        open={historyOpen}
        onClose={closeHistory}
        productId={historyProduct?.id || null}
      />
    </>
  );
}
