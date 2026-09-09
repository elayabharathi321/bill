import api from './api';
import { getStockStatus, calculateStockValue, round } from '../utils/calculations';

// Inventory API.
//
// The inventory system keeps two collections in sync:
//   /products              — current stock levels (source of truth)
//   /inventoryTransactions — immutable audit log of every stock movement
//
// All stock calculation logic (status, value, delta) lives here in the service
// layer so UI components stay free of business logic. When the Spring Boot
// backend is introduced, dedicated endpoints (e.g. GET /api/inventory) can
// replace these functions but must return the same shapes.
const RESOURCE = '/products';
const TRANSACTIONS_RESOURCE = '/inventoryTransactions';

/* ------------------------------------------------------------------ */
/* Transaction direction helpers                                      */
/* ------------------------------------------------------------------ */

// Types that increase stock.
const INCREASE_TYPES = new Set(['PURCHASE', 'RETURN', 'ADJUSTMENT_IN']);

function isStockIncrease(type) {
  return INCREASE_TYPES.has(type);
}

/* ------------------------------------------------------------------ */
/* Enrichment helpers (shared between getInventory and getStockByProduct) */
/* ------------------------------------------------------------------ */

function enrichProduct(product) {
  const stock = Number(product.stockQuantity) || 0;
  const minStock = Number(product.minimumStock) || 0;
  const purchasePrice = Number(product.purchasePrice) || 0;

  return {
    ...product,
    stockStatus: getStockStatus(stock, minStock),
    stockValue: calculateStockValue(stock, purchasePrice),
  };
}

function enrichProducts(products) {
  return (Array.isArray(products) ? products : []).map(enrichProduct);
}

/* ------------------------------------------------------------------ */
/* Summary computation                                                */
/* ------------------------------------------------------------------ */

function buildSummary(products) {
  const totalProducts = products.length;
  let totalStockUnits = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let stockValue = 0;

  for (const product of products) {
    const qty = Number(product.stockQuantity) || 0;
    const min = Number(product.minimumStock) || 0;
    const status = getStockStatus(qty, min);

    totalStockUnits += qty;
    stockValue += calculateStockValue(qty, Number(product.purchasePrice) || 0);

    if (status === 'OUT_OF_STOCK') outOfStock += 1;
    else if (status === 'LOW_STOCK') lowStock += 1;
  }

  return {
    totalProducts,
    totalStockUnits,
    lowStock,
    outOfStock,
    stockValue: round(stockValue),
  };
}

/* ------------------------------------------------------------------ */
/* Public service functions                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch the full product catalogue enriched with computed stock fields
 * (stockStatus, stockValue) plus a summary of inventory KPIs.
 *
 * All products are returned (no server-side pagination) so the summary
 * reflects the entire catalogue. The caller is responsible for any
 * client-side search / filter / pagination of the returned array.
 *
 * @param {object} [params] — forwarded to the API for search / filter.
 * @returns {Promise<{ products: Array, summary: object, total: number }>}
 */
export async function getInventory(params = {}) {
  const { data } = await api.get(RESOURCE, {
    params: { _expand: 'category', ...params },
  });

  const products = enrichProducts(data);
  const summary = buildSummary(products);

  return {
    products,
    summary,
    total: products.length,
  };
}

/**
 * Fetch a single product by ID, enriched with stock status, stock value
 * and its transaction history.
 *
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getStockByProduct(id) {
  const [{ data: product }, { data: transactions }] = await Promise.all([
    api.get(`${RESOURCE}/${id}`, { params: { _expand: 'category' } }),
    api.get(TRANSACTIONS_RESOURCE, { params: { productId: id, _sort: 'createdAt', _order: 'desc' } }),
  ]);

  return {
    product: enrichProduct(product),
    transactions: Array.isArray(transactions) ? transactions : [],
  };
}

/**
 * Adjust a product's stock level.
 *
 * Creates an immutable inventoryTransaction and updates the product's
 * stockQuantity in one atomic operation. The `type` determines the
 * direction: PURCHASE / RETURN / ADJUSTMENT_IN increase stock; SALE /
 * ADJUSTMENT_OUT decrease it.
 *
 * @param {number|string} productId
 * @param {string} type — one of PURCHASE, SALE, RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT
 * @param {number} quantity — magnitude (always positive; direction comes from type)
 * @param {object} [options]
 * @param {string} [options.reason]
 * @param {string} [options.referenceType] — e.g. "purchase", "invoice", "return", "manual"
 * @param {number|string} [options.referenceId]
 * @param {number|string} [options.createdBy]
 * @returns {Promise<object>} the created transaction record (with product snapshot)
 */
export async function adjustStock(productId, type, quantity, options = {}) {
  const { reason = '', referenceType, referenceId, createdBy } = options;

  // Read the current product to establish previousStock.
  const { data: product } = await api.get(`${RESOURCE}/${productId}`);
  const previousStock = Number(product.stockQuantity) || 0;
  const qty = Math.abs(Number(quantity) || 0);

  // Compute new stock, clamped to zero.
  const delta = isStockIncrease(type) ? qty : -qty;
  const newStock = Math.max(0, previousStock + delta);

  const now = new Date().toISOString();

  // Create the immutable transaction record.
  const transactionPayload = {
    productId: Number(productId),
    type,
    quantity: qty,
    previousStock,
    newStock,
    referenceType: referenceType || null,
    referenceId: referenceId || null,
    reason: reason || '',
    createdAt: now,
    createdBy: createdBy || null,
  };

  const transactionResponse = await api.post(TRANSACTIONS_RESOURCE, transactionPayload);

  // Update the product's stock level.
  await api.patch(`${RESOURCE}/${productId}`, {
    stockQuantity: newStock,
    updatedAt: now,
  });

  return {
    transaction: transactionResponse.data,
    previousStock,
    newStock,
  };
}

/**
 * Fetch inventory transaction history.
 *
 * Supports the same params as ModuleIndexPage (pagination, sort, search,
 * plus `productId` and `_expand=product` for resolving product names).
 *
 * @param {object} [params]
 * @returns {Promise<{data: Array, headers: object}>}
 */
export function getInventoryTransactions(params) {
  return api.get(TRANSACTIONS_RESOURCE, { params });
}

/**
 * Fetch products that are at or below their minimum stock level
 * (includes both LOW_STOCK and OUT_OF_STOCK).
 *
 * @returns {Promise<Array>} enriched product list
 */
export async function getLowStockProducts() {
  const { data } = await api.get(RESOURCE, {
    params: { _expand: 'category' },
  });

  return enrichProducts(data).filter((product) => {
    const qty = Number(product.stockQuantity) || 0;
    const min = Number(product.minimumStock) || 0;
    return getStockStatus(qty, min) !== 'IN_STOCK';
  });
}

/* ------------------------------------------------------------------ */
/* Backward-compatible CRUD wrappers for individual transactions       */
/* ------------------------------------------------------------------ */

export function getInventoryTransactionById(id) {
  return api.get(`${TRANSACTIONS_RESOURCE}/${id}`);
}

export function createInventoryTransaction(data) {
  return api.post(TRANSACTIONS_RESOURCE, data);
}

export function updateInventoryTransaction(id, data) {
  return api.put(`${TRANSACTIONS_RESOURCE}/${id}`, data);
}

export function deleteInventoryTransaction(id) {
  return api.delete(`${TRANSACTIONS_RESOURCE}/${id}`);
}
