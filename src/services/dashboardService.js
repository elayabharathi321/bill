import api from './api';
import { getSettings } from './settingsService';
import { calculatePercentChange, round } from '../utils/calculations';

/**
 * Dashboard analytics service.
 *
 * JSON Server has no aggregation endpoints, so this service fetches the raw
 * collections once per dashboard load (short TTL cache, shared between all
 * getters) and computes every KPI here in the service layer — never in UI
 * components. Nothing is hardcoded: every value is derived from the API data.
 *
 * Each exported function returns ready-to-render data for one dashboard
 * section. When the Spring Boot backend is introduced, these functions can be
 * pointed at dedicated endpoints (e.g. GET /api/dashboard/summary) and keep
 * returning the exact same shapes, so no UI changes are required.
 */

// Invoice statuses that count towards sales KPIs (drafts/cancellations excluded).
const SALE_STATUSES = ['paid', 'pending', 'overdue'];
// Invoice statuses with money still awaiting collection.
const OUTSTANDING_STATUSES = ['pending', 'overdue'];
// Payment statuses representing money actually received.
const SETTLED_PAYMENT_STATUSES = ['completed'];
// Fallback low-stock threshold when settings cannot be loaded.
const FALLBACK_LOW_STOCK_THRESHOLD = 10;

// Short-lived cache so a single dashboard load triggers one round of requests.
const CACHE_TTL = 30 * 1000;
let cache = null;

function fetchRawData() {
  return Promise.all([
    api.get('/invoices'),
    api.get('/invoiceItems'),
    api.get('/payments'),
    api.get('/products'),
    api.get('/categories'),
    api.get('/customers'),
    getSettings(),
  ]).then(
    ([
      { data: invoices },
      { data: invoiceItems },
      { data: payments },
      { data: products },
      { data: categories },
      { data: customers },
      { data: settings },
    ]) => ({
      invoices: Array.isArray(invoices) ? invoices : [],
      invoiceItems: Array.isArray(invoiceItems) ? invoiceItems : [],
      payments: Array.isArray(payments) ? payments : [],
      products: Array.isArray(products) ? products : [],
      categories: Array.isArray(categories) ? categories : [],
      customers: Array.isArray(customers) ? customers : [],
      settings: settings && typeof settings === 'object' ? settings : {},
    })
  );
}

/**
 * Shared raw-data fetch. Results are cached briefly so all seven dashboard
 * getters called in parallel share a single round of HTTP requests. Failed
 * fetches are not cached so a retry hits the API again.
 */
function getRawData() {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return cache.promise;
  }
  const promise = fetchRawData();
  cache = { at: Date.now(), promise };
  promise.catch(() => {
    cache = null;
  });
  return promise;
}

/* ------------------------------------------------------------------ */
/* Date helpers (local-time based so "today" matches the user's clock) */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentLocalDateKey() {
  return toLocalDateKey(startOfLocalDay(new Date()));
}

function currentLocalMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Monday-based start of the week containing `date`. */
function startOfLocalWeek(date) {
  const start = startOfLocalDay(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/* ------------------------------------------------------------------ */
/* Sales time series (daily / weekly / monthly, zero-filled)           */
/* ------------------------------------------------------------------ */

function bucketKeyFor(date, granularity) {
  if (granularity === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (granularity === 'weekly') {
    return toLocalDateKey(startOfLocalWeek(date));
  }
  return toLocalDateKey(startOfLocalDay(date));
}

function bucketStartDate(key, granularity) {
  if (granularity === 'monthly') {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function nextBucketStart(date, granularity) {
  const next = new Date(date);
  if (granularity === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (granularity === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function bucketLabels(date, granularity) {
  if (granularity === 'monthly') {
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };
  }
  if (granularity === 'weekly') {
    return {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    };
  }
  return {
    label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullLabel: date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

/**
 * Build a zero-filled sales series for the given granularity. Quiet periods
 * stay visible as zeros so the trend is honest.
 */
function buildSalesSeries(saleInvoices, granularity) {
  const totals = new Map();
  let minKey = null;
  let maxKey = null;

  for (const invoice of saleInvoices) {
    const date = safeDate(invoice.invoiceDate);
    if (!date) continue;
    const key = bucketKeyFor(date, granularity);
    const bucket = totals.get(key) || { sales: 0, bills: 0 };
    bucket.sales += Number(invoice.totalAmount) || 0;
    bucket.bills += 1;
    totals.set(key, bucket);
    if (!minKey || key < minKey) minKey = key;
    if (!maxKey || key > maxKey) maxKey = key;
  }

  if (!minKey) return [];

  // The series always extends up to the current period.
  const currentKey =
    granularity === 'monthly' ? currentLocalMonthKey() : currentLocalDateKey();
  if (currentKey > maxKey) maxKey = currentKey;

  const series = [];
  let cursor = bucketStartDate(minKey, granularity);
  const end = bucketStartDate(maxKey, granularity);
  for (let guard = 0; cursor <= end && guard < 2000; guard += 1) {
    const key = bucketKeyFor(cursor, granularity);
    const bucket = totals.get(key) || { sales: 0, bills: 0 };
    series.push({
      date: key,
      ...bucketLabels(cursor, granularity),
      sales: round(bucket.sales),
      bills: bucket.bills,
    });
    cursor = nextBucketStart(cursor, granularity);
  }
  return series;
}

/**
 * Sales trend data for the main chart.
 * @returns {Promise<{daily: Array, weekly: Array, monthly: Array}>}
 *   Each series point: { date, label, fullLabel, sales, bills }.
 */
export async function getSalesData() {
  const raw = await getRawData();
  const saleInvoices = raw.invoices.filter((invoice) =>
    SALE_STATUSES.includes(invoice.status)
  );
  return {
    daily: buildSalesSeries(saleInvoices, 'daily'),
    weekly: buildSalesSeries(saleInvoices, 'weekly'),
    monthly: buildSalesSeries(saleInvoices, 'monthly'),
  };
}

/* ------------------------------------------------------------------ */
/* Summary KPIs                                                        */
/* ------------------------------------------------------------------ */

function resolveLowStockThreshold(raw) {
  const configured = Number(raw.settings && raw.settings.lowStockThreshold);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : FALLBACK_LOW_STOCK_THRESHOLD;
}

/** Products at or below the minimum stock level, most critical first. */
function resolveLowStockProducts(raw) {
  const threshold = resolveLowStockThreshold(raw);
  return raw.products
    .filter((product) => (Number(product.stockQuantity) || 0) <= threshold)
    .sort((a, b) => (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0));
}

/**
 * Headline KPIs for the summary cards. Every value is derived from live data:
 *  - sales exclude draft/cancelled invoices
 *  - pending payments = outstanding balance of pending/overdue invoices
 *    (only settled payments are deducted from the balance)
 *  - total profit = sum of (unit price - product cost) * quantity
 */
export async function getSummary() {
  const raw = await getRawData();
  const { invoices, payments, invoiceItems, products, customers } = raw;
  const productById = new Map(raw.products.map((product) => [product.id, product]));

  const todayKey = currentLocalDateKey();
  const yesterdayKey = toLocalDateKey(startOfLocalDay(new Date(Date.now() - DAY_MS)));

  // Money actually received per invoice (pending payments do not count yet).
  const settledByInvoice = new Map();
  for (const payment of payments) {
    if (!SETTLED_PAYMENT_STATUSES.includes(payment.status)) continue;
    settledByInvoice.set(
      payment.invoiceId,
      (settledByInvoice.get(payment.invoiceId) || 0) + (Number(payment.amount) || 0)
    );
  }

  // Invoice line items grouped per invoice for the profit calculation.
  const itemsByInvoice = new Map();
  for (const item of invoiceItems) {
    const list = itemsByInvoice.get(item.invoiceId) || [];
    list.push(item);
    itemsByInvoice.set(item.invoiceId, list);
  }

  let todaySales = 0;
  let yesterdaySales = 0;
  let totalSales = 0;
  let todayBills = 0;
  let yesterdayBills = 0;
  let totalBills = 0;
  let pendingPayments = 0;
  let pendingInvoices = 0;
  let totalProfit = 0;

  for (const invoice of invoices) {
    if (!SALE_STATUSES.includes(invoice.status)) continue;

    const amount = Number(invoice.totalAmount) || 0;
    const date = safeDate(invoice.invoiceDate);
    const dateKey = date ? toLocalDateKey(startOfLocalDay(date)) : null;

    totalSales += amount;
    totalBills += 1;
    if (dateKey === todayKey) {
      todaySales += amount;
      todayBills += 1;
    } else if (dateKey === yesterdayKey) {
      yesterdaySales += amount;
      yesterdayBills += 1;
    }

    if (OUTSTANDING_STATUSES.includes(invoice.status)) {
      const settled = settledByInvoice.get(invoice.id) || 0;
      pendingPayments += Math.max(0, amount - settled);
      pendingInvoices += 1;
    }

    for (const item of itemsByInvoice.get(invoice.id) || []) {
      const product = productById.get(item.productId);
      const unitCost = product ? Number(product.purchasePrice) || 0 : 0;
      totalProfit +=
        ((Number(item.unitPrice) || 0) - unitCost) * (Number(item.quantity) || 0);
    }
  }

  return {
    todaySales: round(todaySales),
    yesterdaySales: round(yesterdaySales),
    todaySalesTrend:
      yesterdaySales > 0
        ? Math.round(calculatePercentChange(todaySales, yesterdaySales))
        : undefined,
    totalSales: round(totalSales),
    totalBills,
    todayBills,
    todayBillsTrend:
      yesterdayBills > 0
        ? Math.round(calculatePercentChange(todayBills, yesterdayBills))
        : undefined,
    totalCustomers: customers.length,
    totalProducts: products.length,
    lowStockCount: resolveLowStockProducts(raw).length,
    lowStockThreshold: resolveLowStockThreshold(raw),
    pendingPayments: round(pendingPayments),
    pendingInvoices,
    totalProfit: round(totalProfit),
  };
}

/* ------------------------------------------------------------------ */
/* Chart + table data                                                  */
/* ------------------------------------------------------------------ */

/**
 * Best-selling products by revenue.
 * @returns {Promise<Array<{id, name, sku, unitsSold, revenue}>>}
 */
export async function getTopProducts(limit = 5) {
  const raw = await getRawData();
  const productById = new Map(raw.products.map((product) => [product.id, product]));
  const saleInvoiceIds = new Set(
    raw.invoices
      .filter((invoice) => SALE_STATUSES.includes(invoice.status))
      .map((invoice) => invoice.id)
  );

  const totals = new Map();
  for (const item of raw.invoiceItems) {
    if (!saleInvoiceIds.has(item.invoiceId)) continue;
    const product = productById.get(item.productId);
    const entry = totals.get(item.productId) || {
      id: item.productId,
      name: product ? product.name : `Product #${item.productId}`,
      sku: product && product.sku ? product.sku : '—',
      unitsSold: 0,
      revenue: 0,
    };
    entry.unitsSold += Number(item.quantity) || 0;
    entry.revenue += Number(item.totalPrice) || 0;
    totals.set(item.productId, entry);
  }

  return [...totals.values()]
    .map((entry) => ({ ...entry, revenue: round(entry.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Revenue grouped by product category.
 * @returns {Promise<Array<{name, units, revenue, percentage}>>}
 */
export async function getCategorySales() {
  const raw = await getRawData();
  const productById = new Map(raw.products.map((product) => [product.id, product]));
  const categoryById = new Map(raw.categories.map((category) => [category.id, category]));
  const saleInvoiceIds = new Set(
    raw.invoices
      .filter((invoice) => SALE_STATUSES.includes(invoice.status))
      .map((invoice) => invoice.id)
  );

  const totals = new Map();
  for (const item of raw.invoiceItems) {
    if (!saleInvoiceIds.has(item.invoiceId)) continue;
    const product = productById.get(item.productId);
    const category = product ? categoryById.get(product.categoryId) : null;
    const name = category ? category.name : 'Uncategorized';
    const entry = totals.get(name) || { name, units: 0, revenue: 0 };
    entry.units += Number(item.quantity) || 0;
    entry.revenue += Number(item.totalPrice) || 0;
    totals.set(name, entry);
  }

  const rows = [...totals.values()]
    .map((entry) => ({ ...entry, revenue: round(entry.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  return rows.map((row) => ({
    ...row,
    percentage: totalRevenue ? round((row.revenue / totalRevenue) * 100, 1) : 0,
  }));
}

/**
 * Payment totals grouped by payment method.
 * @returns {Promise<Array<{method, label, total, count}>>}
 */
export async function getPaymentDistribution() {
  const raw = await getRawData();
  const totals = new Map();
  for (const payment of raw.payments) {
    const method = payment.method || 'other';
    const entry = totals.get(method) || {
      method,
      label: formatMethodLabel(method),
      total: 0,
      count: 0,
    };
    entry.total += Number(payment.amount) || 0;
    entry.count += 1;
    totals.set(method, entry);
  }
  return [...totals.values()]
    .map((entry) => ({ ...entry, total: round(entry.total) }))
    .sort((a, b) => b.total - a.total);
}

function formatMethodLabel(method) {
  return String(method)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Most recent invoices with customer names resolved.
 * @returns {Promise<Array<{id, invoiceNumber, customerName, invoiceDate, totalAmount, status, paymentMethod}>>}
 */
export async function getRecentInvoices(limit = 5) {
  const raw = await getRawData();
  const customerById = new Map(raw.customers.map((customer) => [customer.id, customer]));

  return [...raw.invoices]
    .sort((a, b) => {
      const aTime = (safeDate(a.invoiceDate) || { getTime: () => 0 }).getTime();
      const bTime = (safeDate(b.invoiceDate) || { getTime: () => 0 }).getTime();
      return bTime - aTime || b.id - a.id;
    })
    .slice(0, limit)
    .map((invoice) => {
      const customer = customerById.get(invoice.customerId);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customer
          ? customer.name
          : `Customer #${invoice.customerId}`,
        invoiceDate: invoice.invoiceDate,
        totalAmount: round(invoice.totalAmount),
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
      };
    });
}

/**
 * Products at or below the minimum stock level (from store settings).
 * @returns {Promise<Array<{id, name, sku, stock, minStock, status}>>}
 */
export async function getLowStockProducts() {
  const raw = await getRawData();
  const minStock = resolveLowStockThreshold(raw);
  return resolveLowStockProducts(raw).map((product) => {
    const stock = Number(product.stockQuantity) || 0;
    return {
      id: product.id,
      name: product.name,
      sku: product.sku || '—',
      stock,
      minStock,
      status: stock === 0 ? 'out' : 'low',
    };
  });
}