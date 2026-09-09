import api from './api';
import {
  calculateInvoicePaymentSummary,
  getInvoicePaymentSummary,
  getPaymentStatus,
  round,
} from '../utils/calculations';

const RESOURCE = '/invoices';
const ITEMS_RESOURCE = '/invoiceItems';

/**
 * Fetch all invoices with optional search / filter / sort / pagination.
 * JSON Server params: q, customerId, paymentStatus, invoiceStatus,
 * _sort/_order, _page/_limit. Date range (invoiceDate_gte/lte) is supplied
 * by the page (see InvoicesPage baseParams).
 * @param {object} [params={}]
 */
export function getInvoices(params = {}) {
  return api.get(RESOURCE, { params });
}

/**
 * Fetch a single invoice by ID. The returned record is normalized to the
 * spec shape (see normalizeInvoice) so old + new records behave alike.
 * @param {number|string} id
 */
export async function getInvoiceById(id) {
  const res = await api.get(`${RESOURCE}/${id}`);
  return { ...res, data: normalizeInvoice(res.data) };
}

/**
 * Normalize any invoice record (legacy POS shape or new spec shape) to the
 * spec fields:
 * id, invoiceNumber, customerId, items, subtotal, discount, tax, grandTotal,
 * paidAmount, balanceAmount, paymentStatus, invoiceStatus, createdBy, createdAt.
 * Derived money fields are filled from legacy names when missing; payment
 * figures are always reconciled through the centralized calculator so paid +
 * balance always equals the grand total.
 */
export function normalizeInvoice(data) {
  if (!data) return data;
  const normalized = { ...data };
  if (normalized.invoiceNumber == null && normalized.billNumber != null) {
    normalized.invoiceNumber = normalized.billNumber;
  }
  const items = Array.isArray(normalized.items) ? normalized.items : [];
  if (normalized.subtotal == null) {
    normalized.subtotal = round(Number(normalized.subtotal ?? normalized.totalAmount ?? 0) || 0);
  }
  if (normalized.discount == null) {
    normalized.discount = round(Number(normalized.discount ?? normalized.itemDiscount ?? normalized.cartDiscount ?? 0) || 0);
  }
  if (normalized.tax == null) {
    normalized.tax = round(Number(normalized.tax ?? normalized.taxAmount ?? 0) || 0);
  }
  if (normalized.grandTotal == null) {
    normalized.grandTotal = round(Number(normalized.grandTotal ?? normalized.totalAmount ?? 0) || 0);
  }
  if (normalized.totalAmount == null) normalized.totalAmount = normalized.grandTotal;
  if (normalized.invoiceDate == null) normalized.invoiceDate = normalized.createdAt;
  normalized.items = items;
  const summary = getInvoicePaymentSummary(normalized);
  if (normalized.paidAmount == null) normalized.paidAmount = summary.paidAmount;
  if (normalized.balanceAmount == null) normalized.balanceAmount = summary.remainingBalance;
  if (normalized.paymentStatus == null) normalized.paymentStatus = summary.status;
  if (normalized.invoiceStatus == null) {
    const legacy = String(normalized.status || '').toLowerCase();
    normalized.invoiceStatus = legacy === 'cancelled' ? 'CANCELLED' : 'ACTIVE';
  }
  return normalized;
}


/**
 * Create an invoice in the spec shape. Items are embedded on the record
 * (spec: items field) AND mirrored to /invoiceItems for the POS flow.
 * Totals/payment figures always come from the centralized calculators.
 */
export async function createInvoice(data) {
  const now = new Date().toISOString();
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = round(Number(data.subtotal) || 0);
  const discount = round(Number(data.discount) || 0);
  const tax = round(Number(data.tax ?? data.taxAmount) || 0);
  const grandTotal = round(Number(data.grandTotal ?? data.totalAmount ?? subtotal + tax - discount) || 0);
  const summary = calculateInvoicePaymentSummary(grandTotal, []);
  const payload = {
    invoiceNumber: data.invoiceNumber || data.billNumber || '',
    customerId: data.customerId != null ? Number(data.customerId) : null,
    items,
    subtotal,
    discount,
    tax,
    taxAmount: tax,
    grandTotal,
    totalAmount: grandTotal,
    paidAmount: round(Number(data.paidAmount) || 0),
    balanceAmount: summary.remainingBalance,
    paymentStatus: data.paymentStatus || 'UNPAID',
    invoiceStatus: data.invoiceStatus || 'ACTIVE',
    createdBy: data.createdBy ?? null,
    invoiceDate: data.invoiceDate || now,
    createdAt: data.createdAt || now,
    dueDate: data.dueDate || data.invoiceDate || now,
    status: data.status || 'pending',
    notes: data.notes || '',
  };
  const res = await api.post(RESOURCE, payload);
  if (items.length > 0) {
    for (const item of items) {
      try {
        await createInvoiceItem({
          invoiceId: res.data.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? item.sellPrice,
          discountPercent: item.discountPercent || 0,
          taxPercent: item.taxPercent || 0,
          lineSubtotal: item.lineSubtotal,
          lineDiscount: item.lineDiscount,
          lineTax: item.lineTax,
          lineTotal: item.lineTotal,
          totalPrice: item.lineTotal ?? item.totalPrice,
        });
      } catch {
        // Item mirror is best-effort; the embedded spec items stay canonical.
      }
    }
  }
  return { ...res, data: normalizeInvoice(res.data) };
}

/**
 * Cancel an invoice (spec status: ACTIVE -> CANCELLED).
 * Callers must confirm with the user BEFORE invoking this.
 * @param {number|string} id
 */
export async function cancelInvoice(id) {
  const res = await api.get(`${RESOURCE}/${id}`);
  const existing = res.data || {};
  const merged = { ...existing, invoiceStatus: 'CANCELLED', status: 'cancelled' };
  const updated = await api.put(`${RESOURCE}/${id}`, merged);
  return { ...updated, data: normalizeInvoice(updated.data) };
}

export function updateInvoice(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteInvoice(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

/**
 * Fetch line items for an invoice (spec function).
 * Prefers the embedded spec `items`; falls back to /invoiceItems rows.
 * @param {number|string} id - invoice id
 */
export async function getInvoiceItems(id) {
  if (id == null || (typeof id === 'object' && id !== null && !Array.isArray(id))) {
    return api.get(ITEMS_RESOURCE, { params: id });
  }
  try {
    const res = await api.get(`${RESOURCE}/${id}`);
    if (Array.isArray(res.data?.items) && res.data.items.length > 0) {
      return { data: res.data.items };
    }
  } catch {
    // Fall through to the items collection.
  }
  return api.get(ITEMS_RESOURCE, { params: { invoiceId: id } });
}

export function createInvoiceItem(data) {
  return api.post(ITEMS_RESOURCE, data);
}

export function deleteInvoiceItem(id) {
  return api.delete(`${ITEMS_RESOURCE}/${id}`);
}