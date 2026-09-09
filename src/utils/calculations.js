// Business calculation helpers. Keeping these in utils keeps
// presentation components free from business logic and makes the
// logic easy to unit test.

/**
 * Round to a fixed number of decimal places.
 * @param {number} value
 * @param {number} decimals
 */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

/**
 * Calculate a single line total (quantity * unit price).
 * @param {number} quantity
 * @param {number} unitPrice
 */
export function calculateLineTotal(quantity, unitPrice) {
  return round((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/**
 * Calculate the subtotal from a list of line totals.
 * @param {Array<{totalPrice?: number, totalCost?: number}>} items
 * @param {string} field
 */
export function calculateSubtotal(items, field = "totalPrice") {
  if (!Array.isArray(items)) return 0;
  return round(
    items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0),
  );
}

/**
 * Calculate tax amount from a subtotal and a percentage rate.
 * @param {number} subtotal
 * @param {number} taxRatePercent
 */
export function calculateTax(subtotal, taxRatePercent) {
  return round((Number(subtotal) || 0) * ((Number(taxRatePercent) || 0) / 100));
}

/**
 * Calculate a discount amount from a subtotal and a discount percentage.
 * @param {number} subtotal
 * @param {number} discountPercent
 */
export function calculateDiscount(subtotal, discountPercent) {
  return round(
    (Number(subtotal) || 0) * ((Number(discountPercent) || 0) / 100),
  );
}

/**
 * Calculate the grand total: subtotal + tax - discount.
 * @param {number} subtotal
 * @param {number} taxAmount
 * @param {number} discountAmount
 */
export function calculateTotal(subtotal, taxAmount, discountAmount) {
  return round(
    (Number(subtotal) || 0) +
      (Number(taxAmount) || 0) -
      (Number(discountAmount) || 0),
  );
}

/**
 * Calculate profit for a product line.
 * @param {number} price
 * @param {number} cost
 */
export function calculateProfit(price, cost) {
  return round((Number(price) || 0) - (Number(cost) || 0));
}

/**
 * Calculate the percentage change between two values.
 * @param {number} current
 * @param {number} previous
 */
export function calculatePercentChange(current, previous) {
  if (!previous) return 0;
  return round(
    (((Number(current) || 0) - Number(previous)) / Number(previous)) * 100,
  );
}

/**
 * Determine the stock status for a product based on its current quantity
 * and minimum stock threshold.
 *
 * - OUT_OF_STOCK: quantity is zero
 * - LOW_STOCK:    quantity is above zero but at or below the minimum
 * - IN_STOCK:     quantity is above the minimum
 *
 * @param {number} stockQuantity
 * @param {number} minimumStock
 * @returns {'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'}
 */
export function getStockStatus(stockQuantity, minimumStock) {
  const qty = Number(stockQuantity) || 0;
  const min = Number(minimumStock) || 0;
  if (qty === 0) return "OUT_OF_STOCK";
  if (qty <= min) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Calculate the total stock value (cost) for a product:
 * stockQuantity * purchasePrice.
 * @param {number} stockQuantity
 * @param {number} purchasePrice
 */
export function calculateStockValue(stockQuantity, purchasePrice) {
  return round((Number(stockQuantity) || 0) * (Number(purchasePrice) || 0));
}

/* ================================================================== */
/* POS / Bill Calculation Functions                                  */
/* ================================================================== */

/**
 * Calculate the line subtotal: quantity * sellPrice (before discount/tax).
 * @param {number} quantity
 * @param {number} sellPrice
 */
export function calculateLineSubtotal(quantity, sellPrice) {
  return calculateLineTotal(quantity, sellPrice);
}

/**
 * Calculate discount for a single line item.
 * @param {number} lineSubtotal
 * @param {number} discountPercent
 */
export function calculateLineDiscount(lineSubtotal, discountPercent) {
  return calculateDiscount(lineSubtotal, discountPercent);
}

/**
 * Calculate tax for a single line item.
 * @param {number} lineAmount (after discount)
 * @param {number} taxPercent
 */
export function calculateLineTax(lineAmount, taxPercent) {
  return calculateTax(lineAmount, taxPercent);
}

/**
 * Calculate line total: (quantity * price) - lineDiscount + lineTax.
 * @param {number} quantity
 * @param {number} sellPrice
 * @param {number} discountPercent (0-100)
 * @param {number} taxPercent (0-100)
 */
export function calculateLineItemTotal(
  quantity,
  sellPrice,
  discountPercent = 0,
  taxPercent = 0,
) {
  const subtotal = calculateLineSubtotal(quantity, sellPrice);
  const discount = calculateLineDiscount(subtotal, discountPercent);
  const afterDiscount = subtotal - discount;
  const tax = calculateLineTax(afterDiscount, taxPercent);
  return calculateTotal(afterDiscount, tax, 0);
}

/**
 * Calculate cart totals from an array of cart items.
 * Cart items should have: quantity, sellPrice, discountPercent, taxPercent
 * @param {Array<{quantity: number, sellPrice: number, discountPercent?: number, taxPercent?: number}>} cartItems
 * @returns {{subtotal, itemDiscount, afterItemDiscount, cartDiscount, taxAmount, grandTotal}}
 */
export function calculateCartTotals(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      subtotal: 0,
      itemDiscount: 0,
      afterItemDiscount: 0,
      cartDiscount: 0,
      taxAmount: 0,
      grandTotal: 0,
    };
  }

  let subtotal = 0;
  let itemDiscount = 0;
  let afterItemDiscount = 0;
  let taxAmount = 0;

  for (const item of cartItems) {
    const quantity = Number(item.quantity) || 0;
    const sellPrice = Number(item.sellPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const taxPercent = Number(item.taxPercent) || 0;

    const lineSubtotal = calculateLineSubtotal(quantity, sellPrice);
    const lineDiscount = calculateLineDiscount(lineSubtotal, discountPercent);
    const lineAfterDiscount = lineSubtotal - lineDiscount;
    const lineTax = calculateLineTax(lineAfterDiscount, taxPercent);

    subtotal += lineSubtotal;
    itemDiscount += lineDiscount;
    afterItemDiscount += lineAfterDiscount;
    taxAmount += lineTax;
  }

  return {
    subtotal: round(subtotal),
    itemDiscount: round(itemDiscount),
    afterItemDiscount: round(afterItemDiscount),
    cartDiscount: 0,
    taxAmount: round(taxAmount),
    grandTotal: round(afterItemDiscount + taxAmount),
  };
}

/**
 * Apply a bill-level discount and recalculate totals.
 * @param {object} totals - result from calculateCartTotals()
 * @param {number} billDiscountPercent
 * @returns updated totals object
 */
export function applyBillDiscount(totals, billDiscountPercent) {
  const cartDiscount = calculateDiscount(
    totals.afterItemDiscount,
    Number(billDiscountPercent) || 0,
  );
  const afterAllDiscounts = totals.afterItemDiscount - cartDiscount;
  const adjustedTax = calculateTax(
    afterAllDiscounts,
    (totals.taxAmount / totals.afterItemDiscount) * 100 || 0,
  );

  return {
    ...totals,
    cartDiscount: round(cartDiscount),
    taxAmount: round(adjustedTax),
    grandTotal: round(afterAllDiscounts + adjustedTax),
  };
}

/**
 * Calculate balance: grandTotal - paidAmount.
 * @param {number} grandTotal
 * @param {number} paidAmount
 */
export function calculateBalance(grandTotal, paidAmount) {
  return round((Number(grandTotal) || 0) - (Number(paidAmount) || 0));
}

/**
 * Determine payment status based on paid vs total amount.
 * @param {number} paidAmount
 * @param {number} grandTotal
 * @returns {'UNPAID' | 'PARTIAL' | 'PAID'}
 */
export function getPaymentStatus(paidAmount, grandTotal) {
  const paid = Number(paidAmount) || 0;
  const total = Number(grandTotal) || 0;

  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

/**
 * Reconcile an invoice's stored payment figures with its payment list.
 * Pure helper used by services after payment/refund changes so the list,
 * detail and POS views never drift. No UI math — services own this.
 * @param {object} invoice - normalized spec invoice
 * @param {Array} payments - payment records for the invoice
 */
export function reconcileInvoicePayments(invoice, payments) {
  const total = round(Number(invoice?.grandTotal ?? invoice?.totalAmount) || 0);
  const summary = calculateInvoicePaymentSummary(total, payments);
  return {
    paidAmount: summary.paidAmount,
    balanceAmount: summary.remainingBalance,
    paymentStatus: summary.status,
  };
}

/**
 * Derive invoice payment figures from a normalized spec invoice.
 * Pure helper — single place that maps spec fields to the shared
 * payment-summary calculator (no UI math anywhere else).
 * @param {object} invoice - spec shape (grandTotal/paidAmount/balanceAmount/paymentStatus)
 */
export function getInvoicePaymentSummary(invoice) {
  const total = round(Number(invoice?.grandTotal ?? invoice?.totalAmount) || 0);
  const paidAmount = round(Number(invoice?.paidAmount) || 0);
  return {
    invoiceTotal: total,
    paidAmount,
    remainingBalance: calculateRemainingBalance(total, paidAmount),
    status: invoice?.paymentStatus || getPaymentStatus(paidAmount, total),
  };
}

/* ================================================================== */
/* Payment Module Calculations (centralized — spec: keep here)        */
/* ================================================================== */

/**
 * Sum non-refunded payment amounts from a payment list.
 * REFUNDED payments are excluded so reversals don't inflate "paid".
 * @param {Array<{amount?: number, status?: string}>} payments
 */
export function calculatePaidAmount(payments) {
  if (!Array.isArray(payments)) return 0;
  return round(
    payments
      .filter((p) => String(p?.status || "").toUpperCase() !== "REFUNDED")
      .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0),
  );
}

/**
 * Remaining balance for an invoice: total - paid (never negative).
 * @param {number} invoiceTotal
 * @param {number} paidAmount
 */
export function calculateRemainingBalance(invoiceTotal, paidAmount) {
  return round(
    Math.max(0, (Number(invoiceTotal) || 0) - (Number(paidAmount) || 0)),
  );
}

/**
 * Full payment summary for an invoice from its total + payment list.
 * Single source of truth for Paid / Remaining / Status.
 * @param {number} invoiceTotal
 * @param {Array} payments
 * @returns {{invoiceTotal, paidAmount, remainingBalance, status}}
 */
export function calculateInvoicePaymentSummary(invoiceTotal, payments) {
  const total = round(Number(invoiceTotal) || 0);
  const paidAmount = calculatePaidAmount(payments);
  const remainingBalance = calculateRemainingBalance(total, paidAmount);
  return {
    invoiceTotal: total,
    paidAmount,
    remainingBalance,
    status: getPaymentStatus(paidAmount, total),
  };
}

/**
 * Outstanding balance across a set of invoices + their payments.
 * @param {Array<{totalAmount?: number, id?: number}>} invoices
 * @param {Array<{invoiceId?: number, amount?: number, status?: string}>} payments
 */
export function calculateCustomerOutstanding(invoices, payments) {
  if (!Array.isArray(invoices) || invoices.length === 0) return 0;
  const byInvoice = new Map();
  for (const p of payments || []) {
    if (String(p?.status || "").toUpperCase() === "REFUNDED") continue;
    const key = p?.invoiceId;
    byInvoice.set(key, (byInvoice.get(key) || 0) + (Number(p?.amount) || 0));
  }
  return round(
    invoices.reduce((sum, inv) => {
      const total = Number(inv?.totalAmount) || 0;
      const paid = byInvoice.get(inv?.id) || 0;
      return sum + Math.max(0, total - paid);
    }, 0),
  );
}
