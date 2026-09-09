import api from "./api";
import * as invoiceService from "./invoiceService";
import * as paymentService from "./paymentService";
import * as customerService from "./customerService";
import { getProducts, updateProduct } from "./productService";
import { createAuditLog } from "./auditLogService";
import { getPaymentStatus } from "../utils/calculations";

/**
 * Billing Service - Transaction Workflow
 *
 * This service orchestrates the complete POS transaction workflow:
 * 1. Cart validation
 * 2. Stock availability check
 * 3. Invoice creation
 * 4. Invoice items creation
 * 5. Payment recording
 * 6. Inventory update
 * 7. Audit log creation
 *
 * The workflow is structured to be easily replaceable with a single
 * Spring Boot transactional endpoint (/api/billing/complete-transaction).
 */

/* ================================================================== */
/* Cart Validation                                                    */
/* ================================================================== */

/**
 * Validate the cart before processing.
 * @param {Array} cartItems
 * @returns {object} {valid: boolean, errors: []}
 */
export function validateCart(cartItems) {
  const errors = [];

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    errors.push("Cart is empty");
  }

  cartItems.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Missing product ID`);
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    if (!item.sellPrice || Number(item.sellPrice) <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if all cart items have sufficient stock.
 * @param {Array} cartItems
 * @returns {Promise<object>} {available: boolean, unavailable: []}
 */
export async function checkStockAvailability(cartItems) {
  const unavailable = [];

  try {
    const response = await getProducts();
    const products = response.data || [];

    for (const cartItem of cartItems) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        unavailable.push({
          productId: cartItem.productId,
          reason: "Product not found",
        });
      } else {
        const stockQty = Number(product.stockQuantity) || 0;
        const cartQty = Number(cartItem.quantity) || 0;
        if (cartQty > stockQty) {
          unavailable.push({
            productId: cartItem.productId,
            productName: product.name,
            requested: cartQty,
            available: stockQty,
          });
        }
      }
    }
  } catch (error) {
    throw new Error(`Stock check failed: ${error.message}`);
  }

  return {
    available: unavailable.length === 0,
    unavailable,
  };
}

/* ================================================================== */
/* Invoice & Payment Creation                                         */
/* ================================================================== */

/**
 * Get or create walk-in customer.
 * Walk-in customers have a fixed ID and are reused.
 * @returns {Promise<object>} customer object
 */
export async function getOrCreateWalkInCustomer() {
  try {
    // Try to find existing walk-in customer
    const response = await customerService.getCustomers({
      name: "Walk-in Customer",
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    // Create if doesn't exist
    const newWalkIn = await customerService.createCustomer({
      name: "Walk-in Customer",
      email: "walk-in@billapp.local",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    });

    return newWalkIn.data;
  } catch (error) {
    throw new Error(`Failed to get/create walk-in customer: ${error.message}`);
  }
}

/**
 * Create an invoice record.
 * Spec shape: invoiceNumber, customerId, items, subtotal, discount, tax,
 * grandTotal, paidAmount, balanceAmount, paymentStatus, invoiceStatus,
 * createdBy, createdAt. Delegates totals to invoiceService (centralized
 * calculators) and keeps legacy names as mirrors for old screens.
 */
export async function createInvoiceRecord(params) {
  try {
    const items = Array.isArray(params.items) ? params.items : [];
    const response = await invoiceService.createInvoice({
      customerId: params.customerId,
      invoiceNumber: params.billNumber || params.invoiceNumber,
      billNumber: params.billNumber || params.invoiceNumber,
      invoiceDate: params.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: params.dueDate || params.invoiceDate || new Date().toISOString().split("T")[0],
      items,
      subtotal: params.subtotal,
      discount: params.discount ?? params.itemDiscount ?? params.cartDiscount ?? 0,
      tax: params.tax ?? params.taxAmount ?? 0,
      taxAmount: params.taxAmount ?? params.tax ?? 0,
      grandTotal: params.grandTotal ?? params.totalAmount,
      totalAmount: params.totalAmount ?? params.grandTotal,
      createdBy: params.createdBy ?? params.userId ?? null,
      status: "DRAFT",
      invoiceStatus: "ACTIVE",
      paymentStatus: "UNPAID",
      notes: params.notes || "",
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
}

/**
 * Create invoice items for all cart items.
 * Writes the canonical spec `items` onto the invoice (embedded) and mirrors
 * each line to /invoiceItems for the legacy POS flow. Line math only uses
 * centralized helpers (calculateLineTotal / calculateDiscount / round).
 */
export async function createInvoiceItems(invoiceId, cartItems) {
  const createdItems = [];

  try {
    const { calculateDiscount, calculateLineTotal, round } = await import("../utils/calculations.js");
    const taxed = (cartItems || []).map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.sellPrice ?? item.unitPrice) || 0;
      const lineSubtotal = calculateLineTotal(qty, price);
      const lineDiscount = calculateDiscount(lineSubtotal, Number(item.discountPercent) || 0);
      return {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: qty,
        unitPrice: price,
        sellPrice: price,
        discountPercent: Number(item.discountPercent) || 0,
        taxPercent: Number(item.taxPercent) || 0,
        lineSubtotal,
        lineDiscount,
        lineTax: round(Number(item.lineTax) || 0),
        lineTotal: item.lineTotal ?? round(lineSubtotal - lineDiscount + (Number(item.lineTax) || 0)),
        totalPrice: item.lineTotal ?? round(lineSubtotal - lineDiscount + (Number(item.lineTax) || 0)),
      };
    });
    for (const item of taxed) {
      const response = await invoiceService.createInvoiceItem({
        invoiceId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        lineSubtotal: item.lineSubtotal,
        lineDiscount: item.lineDiscount,
        lineTax: item.lineTax,
        lineTotal: item.lineTotal,
        totalPrice: item.totalPrice,
      });
      createdItems.push(response.data);
    }
    // Embed the canonical items on the invoice record itself (spec field).
    try {
      const { data: existing } = await invoiceService.getInvoiceById(invoiceId);
      await invoiceService.updateInvoice(invoiceId, { ...existing, items: taxed });
    } catch {
      // Embedded mirror is best-effort; /invoiceItems rows are authoritative fallback.
    }
  } catch (error) {
    throw new Error(`Failed to create invoice items: ${error.message}`);
  }

  return createdItems;
}

/**
 * Create a payment record.
 * Accepts both the new spec shape (status/transactionReference) and the
 * legacy POS shape (transactionId) — both are stored for compatibility.
 * @param {object} params - {invoiceId, customerId, amount, method, status, transactionId, transactionReference, paymentDate, notes}
 * @returns {Promise<object>} created payment
 */
export async function createPaymentRecord(params) {
  try {
    const response = await paymentService.createPayment({
      invoiceId: params.invoiceId,
      customerId: params.customerId,
      amount: params.amount,
      method: params.method, // CASH, UPI, CARD, BANK_TRANSFER, CREDIT
      status: params.status, // PAID, PARTIAL, UNPAID
      paymentDate: new Date().toISOString().split("T")[0],
      transactionReference: params.transactionReference || params.transactionId || "",
      transactionId: params.transactionId || params.transactionReference || "",
      notes: params.notes || "",
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/* ================================================================== */
/* Inventory Update                                                   */
/* ================================================================== */

/**
 * Update product stock quantities after a successful transaction.
 * @param {Array} cartItems
 * @returns {Promise<Array>} updated products
 */
export async function updateInventoryAfterSale(cartItems) {
  const updated = [];

  try {
    const response = await getProducts();
    const allProducts = response.data || [];

    for (const cartItem of cartItems) {
      const product = allProducts.find((p) => p.id === cartItem.productId);
      if (product) {
        const newStock = Math.max(
          0,
          (Number(product.stockQuantity) || 0) -
            (Number(cartItem.quantity) || 0),
        );

        const updateResponse = await updateProduct(product.id, {
          stockQuantity: newStock,
        });

        updated.push(updateResponse.data);
      }
    }
  } catch (error) {
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  return updated;
}

/* ================================================================== */
/* Audit Logging                                                      */
/* ================================================================== */

/**
 * Create audit log entry for a completed transaction.
 * @param {object} params - {invoiceId, userId, action, details}
 * @returns {Promise<object>} created audit log
 */
export async function createTransactionAuditLog(params) {
  try {
    const response = await createAuditLog({
      entityType: "INVOICE",
      entityId: params.invoiceId,
      userId: params.userId,
      action: params.action || "TRANSACTION_COMPLETE",
      details: params.details || {},
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create audit log: ${error.message}`);
  }
}

/* ================================================================== */
/* Main Transaction Workflow                                          */
/* ================================================================== */

/**
 * Complete a full POS transaction.
 *
 * This is the main entry point that orchestrates:
 * 1. Cart validation
 * 2. Stock availability check
 * 3. Customer selection
 * 4. Invoice creation
 * 5. Invoice items creation
 * 6. Payment recording
 * 7. Inventory update
 * 8. Audit log creation
 *
 * Future: This entire function can be replaced with a single
 * POST /api/billing/complete-transaction endpoint in Spring Boot.
 *
 * @param {object} params - {
 *   cartItems,
 *   customerId,
 *   billNumber,
 *   subtotal,
 *   itemDiscount,
 *   cartDiscount,
 *   taxAmount,
 *   grandTotal,
 *   paidAmount,
 *   paymentMethod,
 *   userId,
 *   notes,
 * }
 * @returns {Promise<object>} transaction result with invoice, payment, etc.
 */
export async function completeTransaction(params) {
  const {
    cartItems,
    customerId,
    billNumber,
    subtotal,
    itemDiscount,
    cartDiscount,
    taxAmount,
    grandTotal,
    paidAmount,
    paymentMethod,
    userId,
    notes = "",
  } = params;

  try {
    // Step 1: Validate cart
    const cartValidation = validateCart(cartItems);
    if (!cartValidation.valid) {
      throw new Error(
        `Cart validation failed: ${cartValidation.errors.join(", ")}`,
      );
    }

    // Step 2: Check stock availability
    const stockCheck = await checkStockAvailability(cartItems);
    if (!stockCheck.available) {
      const unavailableItems = stockCheck.unavailable
        .map(
          (item) =>
            `${item.productName} (requested: ${item.requested}, available: ${item.available})`,
        )
        .join("; ");
      throw new Error(`Insufficient stock: ${unavailableItems}`);
    }

    // Step 3: Get customer (use walk-in if not provided)
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      const walkInCustomer = await getOrCreateWalkInCustomer();
      finalCustomerId = walkInCustomer.id;
    }

    // Step 4: Create invoice
    const invoice = await createInvoiceRecord({
      customerId: finalCustomerId,
      billNumber,
      subtotal,
      itemDiscount,
      cartDiscount,
      taxAmount,
      totalAmount: grandTotal,
      notes,
    });

    // Step 5: Create invoice items
    await createInvoiceItems(invoice.id, cartItems);

    // Step 6: Create payment
    const paymentStatus = getPaymentStatus(paidAmount, grandTotal);
    const payment = await createPaymentRecord({
      invoiceId: invoice.id,
      customerId: finalCustomerId,
      amount: paidAmount,
      method: paymentMethod,
      status: paymentStatus,
    });

    // Step 7: Reconcile invoice payment figures from the ledger (centralized
    // calculators inside paymentService sync; just refresh + keep legacy names).
    const { data: synced } = await invoiceService.getInvoiceById(invoice.id);
    await invoiceService.updateInvoice(invoice.id, {
      ...synced,
      paidAmount: synced.paidAmount,
      balanceAmount: synced.balanceAmount,
      paymentStatus: synced.paymentStatus,
      totalAmount: synced.grandTotal,
      status: synced.paymentStatus === "PAID" ? "paid" : synced.paymentStatus === "PARTIAL" ? "pending" : synced.status,
    });

    // Step 8: Update inventory
    await updateInventoryAfterSale(cartItems);

    // Step 9: Create audit log
    await createTransactionAuditLog({
      invoiceId: invoice.id,
      userId,
      action: "TRANSACTION_COMPLETE",
      details: {
        billNumber,
        customerId: finalCustomerId,
        totalAmount: grandTotal,
        paidAmount,
        paymentMethod,
        cartItems: cartItems.length,
      },
    });

    // Return complete transaction result
    return {
      success: true,
      invoice,
      payment,
      paymentStatus,
      message: `Transaction completed successfully. Bill #${billNumber}`,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch an invoice with all its items and payment details.
 * @param {number} invoiceId
 * @returns {Promise<object>} invoice with items and payment
 */
export async function getTransactionDetails(invoiceId) {
  try {
    const invoiceResponse = await invoiceService.getInvoiceById(invoiceId);
    const invoice = invoiceResponse.data;

    const itemsResponse = await invoiceService.getInvoiceItems({
      invoiceId,
    });
    const items = itemsResponse.data || [];

    const paymentResponse = await paymentService.getPayments({
      invoiceId,
    });
    const payments = paymentResponse.data || [];

    return {
      invoice,
      items,
      payments,
    };
  } catch (error) {
    throw new Error(`Failed to fetch transaction details: ${error.message}`);
  }
}
