import api from './api';
import {
  calculateCustomerOutstanding,
  calculatePaidAmount,
  reconcileInvoicePayments,
} from '../utils/calculations';

const RESOURCE = '/payments';

/**
 * Fetch all payments with optional search / filter / sort / pagination.
 * JSON Server params supported: q, invoiceId, customerId, method, status,
 * _sort/_order, _page/_limit. Date range is applied client-side in the page
 * (json-server has no between operator).
 * @param {object} [params={}]
 */
export function getPayments(params = {}) {
  return api.get(RESOURCE, { params });
}

/**
 * Fetch a single payment by ID.
 * @param {number|string} id
 */
export function getPaymentById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

/**
 * Normalize a payment record to the spec shape while accepting legacy
 * field names (reference/transactionId, lowercase method, completed/pending
 * status) so old records and the POS flow keep working.
 */
export function normalizePayment(data) {
  const normalized = { ...data };
  if (normalized.transactionReference == null && normalized.reference != null) {
    normalized.transactionReference = normalized.reference;
  }
  if (normalized.reference == null && normalized.transactionReference != null) {
    normalized.reference = normalized.transactionReference;
  }
  if (normalized.method != null) normalized.method = String(normalized.method).toUpperCase();
  const statusMap = { completed: 'PAID', paid: 'PAID', pending: 'PARTIAL', partial: 'PARTIAL' };
  if (normalized.status != null) {
    const key = String(normalized.status).toLowerCase();
    normalized.status = statusMap[key] || String(normalized.status).toUpperCase();
  }
  return normalized;
}

/**
 * Create a new payment. Spec fields:
 * invoiceId, customerId, amount, method, status, transactionReference,
 * paymentDate, notes. customerId is resolved from the invoice when omitted.
 * @param {object} data
 */
export async function createPayment(data) {
  const now = new Date().toISOString();
  let customerId = data.customerId;
  if (customerId == null && data.invoiceId != null) {
    try {
      const { data: invoice } = await api.get(`/invoices/${data.invoiceId}`);
      customerId = invoice?.customerId ?? null;
    } catch {
      customerId = null;
    }
  }
  const payload = {
    invoiceId: data.invoiceId != null ? Number(data.invoiceId) : null,
    customerId: customerId != null ? Number(customerId) : null,
    amount: Number(data.amount) || 0,
    method: data.method ? String(data.method).toUpperCase() : 'CASH',
    status: data.status ? String(data.status).toUpperCase() : 'PAID',
    transactionReference: data.transactionReference || data.reference || '',
    paymentDate: data.paymentDate || now,
    notes: data.notes || '',
    createdAt: data.createdAt || now,
  };
  const created = await api.post(RESOURCE, payload);
  await syncInvoiceAfterPaymentChange(created.data?.invoiceId ?? payload.invoiceId);
  return created;
}

/**
 * Update a payment (PUT). Merges with the existing record so invoiceId /
 * customerId / createdAt are preserved on partial updates.
 * @param {number|string} id
 * @param {object} data
 */
export async function updatePayment(id, data) {
  let merged = { ...data };
  try {
    const { data: existing } = await getPaymentById(id);
    merged = { ...existing, ...data, id: existing.id, createdAt: existing.createdAt };
  } catch {
    // Record may have been deleted mid-edit — fall through with supplied data.
  }
  if (merged.method != null) merged.method = String(merged.method).toUpperCase();
  if (merged.status != null) merged.status = String(merged.status).toUpperCase();
  if (merged.transactionReference != null) merged.reference = merged.transactionReference;
  if (merged.reference != null && merged.transactionReference == null) {
    merged.transactionReference = merged.reference;
  }
  const updated = await api.put(`${RESOURCE}/${id}`, merged);
  await syncInvoiceAfterPaymentChange(updated.data?.invoiceId ?? merged.invoiceId);
  return updated;
}

/**
 * Reverse a payment: marks the record REFUNDED (money returned to customer).
 * Callers must confirm with the user BEFORE invoking this.
 * @param {number|string} id
 * @param {object} [extra={}] - optional extra fields (e.g. notes)
 */
export async function refundPayment(id, extra = {}) {
  const { data: existing } = await getPaymentById(id);
  return updatePayment(id, {
    ...existing,
    ...extra,
    status: 'REFUNDED',
  });
}

/**
 * Recompute an invoice's stored paid/balance/status from its payment list.
 * Called automatically after every payment create / update / refund so the
 * invoice list + InvoiceView never drift from the payments ledger.
 * Best-effort: never throws (ledger write already succeeded).
 */
async function syncInvoiceAfterPaymentChange(invoiceId) {
  if (invoiceId == null) return;
  try {
    const [{ data: invoice }, { data: payments }] = await Promise.all([
      api.get(`/invoices/${invoiceId}`),
      api.get(RESOURCE, { params: { invoiceId } }),
    ]);
    if (!invoice) return;
    const reconciled = reconcileInvoicePayments(invoice, payments);
    const paidTotal = calculatePaidAmount(payments);
    await api.put(`/invoices/${invoiceId}`, {
      ...invoice,
      paidAmount: reconciled.paidAmount,
      balanceAmount: reconciled.balanceAmount,
      paymentStatus: reconciled.status,
      totalAmount: invoice.totalAmount ?? invoice.grandTotal,
      grandTotal: invoice.grandTotal ?? invoice.totalAmount,
      _paidTotal: paidTotal,
    });
  } catch {
    // Ignore sync failures — payment itself is already recorded.
  }
}

/**
 * Outstanding balances per customer: { customerId, name, outstanding } for
 * every customer with balance > 0. Calculations are centralized in
 * utils/calculations (calculateCustomerOutstanding).
 */
export async function getCustomerOutstanding(customerId) {
  const invoicesRes = await api.get('/invoices', customerId ? { params: { customerId } } : {});
  const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
  const invoiceIds = invoices.map((inv) => inv.id);
  const payRes = await api.get(RESOURCE);
  const allPayments = Array.isArray(payRes.data) ? payRes.data : [];
  const payments = allPayments.filter((p) => invoiceIds.includes(p.invoiceId));
  if (customerId) {
    return calculateCustomerOutstanding(invoices, payments);
  }
  const customersRes = await api.get('/customers');
  const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
  return customers
    .map((c) => {
      const cInvoices = invoices.filter((inv) => inv.customerId === c.id);
      const cInvoiceIds = new Set(cInvoices.map((inv) => inv.id));
      const cPayments = allPayments.filter((p) => cInvoiceIds.has(p.invoiceId));
      return {
        customerId: c.id,
        name: c.name,
        outstanding: calculateCustomerOutstanding(cInvoices, cPayments),
      };
    })
    .filter((row) => row.outstanding > 0);
}