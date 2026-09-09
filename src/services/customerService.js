import api from './api';
import { calculateCustomerOutstanding } from '../utils/calculations';

const RESOURCE = "/customers";

/**
 * Fetch all customers with optional search / filter / sort / pagination.
 * @param {object} [params={}]
 */
export function getCustomers(params = {}) {
  return api.get(RESOURCE, { params });
}

/**
 * Fetch a single customer by ID.
 * @param {number|string} id
 */
export function getCustomerById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

/**
 * Create a new customer. Applies spec defaults so callers pass form values.
 * @param {object} data - { name, phone, email, address, city, state, postalCode, gstNumber }
 */
export function createCustomer(data) {
  const now = new Date().toISOString();
  const payload = {
    name: (data.name || "").trim(),
    phone: data.phone || "",
    email: data.email || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    postalCode: data.postalCode || "",
    gstNumber: data.gstNumber || "",
    totalPurchases: Number(data.totalPurchases) || 0,
    outstandingAmount: Number(data.outstandingAmount) || 0,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
  return api.post(RESOURCE, payload);
}

/**
 * Update a customer (PUT). Merges with existing record so computed
 * fields (totals / createdAt) are not lost on edit.
 * @param {number|string} id
 * @param {object} data - partial or full customer fields
 */
export async function updateCustomer(id, data) {
  let merged = { ...data };
  try {
    const { data: existing } = await getCustomerById(id);
    merged = { ...existing, ...data, id: existing.id, createdAt: existing.createdAt };
  } catch {
    // Record may have been deleted mid-edit — fall through with supplied data.
  }
  merged.updatedAt = new Date().toISOString();
  return api.put(`${RESOURCE}/${id}`, merged);
}

/**
 * Delete a customer.
 * @param {number|string} id
 */
export function deleteCustomer(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

/**
 * Fetch purchase history (invoices) for a customer, newest first.
 * Each row: { invoice, date, amount, paid, balance, status, raw }.
 * NOTE: payments are linked via `invoiceId`, so paid is resolved per invoice.
 * @param {number|string} customerId
 */
export async function getCustomerInvoices(customerId) {
  try {
    const invoicesRes = await api.get("/invoices", {
      params: { customerId, _sort: "invoiceDate", _order: "desc" },
    });
    const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        let paid = 0;
        try {
          const payRes = await api.get("/payments", { params: { invoiceId: inv.id } });
          const list = Array.isArray(payRes.data) ? payRes.data : [];
          const active = list.filter(
            (p) => String(p.status || "").toUpperCase() !== "REFUNDED",
          );
          paid = active.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        } catch {
          paid = 0;
        }
        const amount = Number(inv.totalAmount) || 0;
        return {
          invoice: inv.invoiceNumber || inv.billNumber || `#${inv.id}`,
          date: inv.invoiceDate || inv.createdAt,
          amount,
          paid,
          balance: Math.max(0, amount - paid),
          status: inv.status || "draft",
          raw: inv,
        };
      }),
    );

    enriched.response = invoicesRes;
    return enriched;
  } catch (error) {
    throw new Error(`Failed to fetch customer invoices: ${error.message}`);
  }
}

/**
 * Customer detail aggregates: { totalPurchases, totalInvoices, totalPaid, outstandingAmount }.
 * Payments are resolved via invoiceIds (payments link by invoiceId in db.json).
 * @param {number|string} customerId
 */
export async function getCustomerStats(customerId) {
  try {
    const invoicesRes = await api.get("/invoices", { params: { customerId } });
    const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
    const invoiceIds = invoices.map((inv) => inv.id);

    let payments = [];
    if (invoiceIds.length > 0) {
      const payRes = await api.get("/payments");
      const all = Array.isArray(payRes.data) ? payRes.data : [];
      payments = all.filter((p) => invoiceIds.includes(p.invoiceId));
    }

    const totalInvoices = invoices.length;
    const totalPurchases = invoices.reduce(
      (sum, inv) => sum + (Number(inv.totalAmount) || 0),
      0,
    );
    const totalPaid = payments
      .filter((p) => String(p.status || "").toUpperCase() !== "REFUNDED")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalInvoices,
      totalPurchases,
      totalPaid,
      outstandingAmount: calculateCustomerOutstanding(invoices, payments),
    };
  } catch (error) {
    throw new Error(`Failed to fetch customer stats: ${error.message}`);
  }
}
