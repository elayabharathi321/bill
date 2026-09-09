import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getInvoicePaymentSummary, calculateInvoicePaymentSummary } from "../../utils/calculations";

/**
 * Reusable InvoiceView — single source of truth for invoice rendering.
 * Used identically for screen, print and PDF export so outputs never drift.
 * Props: { invoice, items, customer, business, payments }.
 * All money math arrives via props/services — this only formats + renders.
 */
export default function InvoiceView({ invoice, items = [], customer = null, business = null, payments = [] }) {
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => { setLogoFailed(false); }, [business?.logo]);
  if (!invoice) return null;
  const lines = Array.isArray(items) && items.length > 0 ? items : Array.isArray(invoice.items) ? invoice.items : [];
  const summary = getInvoicePaymentSummary(invoice);
  const biz = {
    name: business?.storeName || business?.name || "BillApp Superstore",
    address: business?.storeAddress || business?.address || "123 Commerce Street, Austin, TX 78701",
    phone: business?.storePhone || business?.phone || "+1 555-000-1234",
    email: business?.storeEmail || business?.email || "support@billapp.com",
    logo: business?.logo || null,
  };
  const cust = {
    name: customer?.name || (invoice.customerId ? `Customer #${invoice.customerId}` : "Walk-in Customer"),
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: [customer?.address, customer?.city, customer?.state, customer?.postalCode].filter(Boolean).join(", "),
  };
  const number = invoice.invoiceNumber || invoice.billNumber || `#${invoice.id}`;
  const method = payments[0]?.method || invoice.paymentMethod || "—";
  const ref = payments[0]?.transactionReference || payments[0]?.reference || "—";
  return (
    <div className="invoice-document bg-white text-gray-900" data-invoice-view={number}>
      <div className="flex items-start justify-between gap-4 border-b-2 border-gray-900 pb-4">
        <div className="flex items-center gap-3">
          {biz.logo && !logoFailed && (<img src={biz.logo} alt="" onError={() => setLogoFailed(true)} className="h-12 w-12 object-contain" />)}
          <div>
            <h1 className="text-xl font-bold">{biz.name}</h1>
            <p className="text-xs text-gray-600">{biz.address}</p>
            <p className="text-xs text-gray-600">{biz.phone} · {biz.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">INVOICE</p>
          <p className="text-sm font-semibold">{number}</p>
          <p className="text-xs text-gray-600">{formatDate(invoice.invoiceDate || invoice.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</p>
          <p className="font-semibold">{cust.name}</p>
          {cust.phone && (<p className="text-gray-600">{cust.phone}</p>)}
          {cust.email && (<p className="text-gray-600">{cust.email}</p>)}
          {cust.address && (<p className="text-gray-600">{cust.address}</p>)}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</p>
          <p>Status: <strong>{summary.status}</strong></p>
          <p className="text-gray-600">Method: {String(method).replace("_", " ")}</p>
          {ref !== "—" && (<p className="text-gray-600">Ref: {ref}</p>)}
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-300 text-left">
              <th className="py-2 pr-2">Product</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Price</th>
              <th className="py-2 pr-2 text-right">Discount</th>
              <th className="py-2 pr-2 text-right">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id ?? i} className="border-b border-gray-100">
                <td className="py-2 pr-2">{l.productName || l.name || (l.productId ? `#${l.productId}` : "Item")}</td>
                <td className="py-2 pr-2 text-right">{l.quantity ?? "—"}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(l.unitPrice ?? l.sellPrice ?? l.price ?? 0)}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(l.lineDiscount ?? l.discount ?? 0)}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(l.lineTax ?? l.tax ?? 0)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(l.lineTotal ?? l.totalPrice ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Totals</div>
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Discount</span><span>-{formatCurrency(invoice.discount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>{formatCurrency(invoice.tax)}</span></div>
          <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold"><span>Grand Total</span><span>{formatCurrency(summary.invoiceTotal)}</span></div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment Information</div>
          <div className="flex justify-between"><span className="text-gray-600">Invoice Total</span><span>{formatCurrency(summary.invoiceTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Paid Amount</span><span>{formatCurrency(summary.paidAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Remaining Balance</span><span className={summary.remainingBalance > 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>{formatCurrency(summary.remainingBalance)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Payment Method</span><span>{String(method).replace("_", " ")}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Payment Date</span><span>{payments[0]?.paymentDate ? formatDate(payments[0].paymentDate) : "—"}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Reference</span><span>{ref !== "—" ? ref : "—"}</span></div>
        </div>
      </div>

      {invoice.notes && (<p className="mt-4 text-xs text-gray-500">Note: {invoice.notes}</p>)}
    </div>
  );
}
