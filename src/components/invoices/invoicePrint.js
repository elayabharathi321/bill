import jsPDF from "jspdf";

/** Build standalone printable HTML from the same invoice document data. */
export function buildInvoiceHTML({ invoice, items = [], customer = null, business = null, payments = [] }) {
  const lines = Array.isArray(items) && items.length > 0 ? items : Array.isArray(invoice?.items) ? invoice.items : [];
  const bizName = business?.storeName || business?.name || "BillApp Superstore";
  const bizAddr = business?.storeAddress || business?.address || "";
  const number = invoice?.invoiceNumber || invoice?.billNumber || `#${invoice?.id}`;
  const custName = customer?.name || "Walk-in Customer";
  const rows = lines.map((l) => `<tr><td>${l.productName || l.name || "Item"}</td><td style="text-align:right">${l.quantity ?? ""}</td><td style="text-align:right">${Number(l.unitPrice ?? l.sellPrice ?? 0).toFixed(2)}</td><td style="text-align:right">${Number(l.lineDiscount ?? 0).toFixed(2)}</td><td style="text-align:right">${Number(l.lineTax ?? 0).toFixed(2)}</td><td style="text-align:right">${Number(l.lineTotal ?? l.totalPrice ?? 0).toFixed(2)}</td></tr>`).join("");
  const money = (v) => Number(v || 0).toFixed(2);
  const firstPay = Array.isArray(payments) && payments.length ? payments[0] : null;
  const payMethod = firstPay?.method ? String(firstPay.method).replace("_", " ") : "—";
  const payDate = firstPay?.paymentDate ? String(firstPay.paymentDate).slice(0, 10) : "—";
  const payRef = (firstPay?.transactionReference || firstPay?.reference || "—").trim() || "—";
  const payInfo = `<div class="pay-info"><h3>Payment Information</h3><p><strong>Invoice Total:</strong> $${money(invoice?.grandTotal ?? invoice?.totalAmount)}</p><p><strong>Paid Amount:</strong> $${money(invoice?.paidAmount)}</p><p><strong>Remaining Balance:</strong> $${money(invoice?.balanceAmount)}</p><p><strong>Payment Method:</strong> ${payMethod}</p><p><strong>Payment Date:</strong> ${payDate}</p><p><strong>Reference:</strong> ${payRef}</p></div>`;
  return `<!DOCTYPE html><html><head><title>Invoice ${number}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}table{width:100%;border-collapse:collapse;margin:16px 0}th{border-bottom:2px solid #111;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}.totals{margin-left:auto;width:260px}.totals div{display:flex;justify-content:space-between;margin:4px 0}.grand{font-weight:bold;font-size:18px;border-top:2px solid #111;padding-top:8px}.pay-info{margin-top:24px;padding:12px;border:1px solid #ddd}h3{margin-top:0}</style></head><body><h1>${bizName}</h1><p>${bizAddr}</p><h2>Invoice ${number}</h2><p>Customer: ${custName}</p><p>Date: ${String(invoice?.invoiceDate || invoice?.createdAt || "").slice(0, 10)}</p><table><thead><tr><th>Product</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Discount</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Subtotal</span><span>$${money(invoice?.subtotal)}</span></div><div><span>Discount</span><span>-$${money(invoice?.discount)}</span></div><div><span>Tax</span><span>$${money(invoice?.tax)}</span></div><div class="grand"><span>Grand Total</span><span>$${money(invoice?.grandTotal ?? invoice?.totalAmount)}</span></div><div><span>Paid</span><span>$${money(invoice?.paidAmount)}</span></div><div><span>Balance</span><span>$${money(invoice?.balanceAmount)}</span></div></div>${payInfo}</body></html>`;
}

/** Print the invoice using the same data as screen/PDF. */
export function printInvoiceDoc(doc) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildInvoiceHTML(doc));
  w.document.close();
  w.focus();
  w.print();
}


/** Download the invoice as PDF via jsPDF (already a project dependency). */
export function downloadInvoicePDF(doc) {
  const { invoice, items = [], customer = null, business = null, payments = [] } = doc;
  const lines = Array.isArray(items) && items.length > 0 ? items : Array.isArray(invoice?.items) ? invoice.items : [];
  const firstPay = Array.isArray(payments) && payments.length ? payments[0] : null;
  const payMethod = firstPay?.method ? String(firstPay.method).replace("_", " ") : "—";
  const payDate = firstPay?.paymentDate ? String(firstPay.paymentDate).slice(0, 10) : "—";
  const payRef = (firstPay?.transactionReference || firstPay?.reference || "—").trim() || "—";
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 50;
  pdf.setFontSize(16);
  pdf.text(String(business?.storeName || business?.name || "BillApp Superstore"), margin, y);
  y += 16;
  pdf.setFontSize(9);
  pdf.text(String(business?.storeAddress || business?.address || ""), margin, y);
  y += 24;
  pdf.setFontSize(13);
  pdf.text(`Invoice ${invoice?.invoiceNumber || invoice?.billNumber || `#${invoice?.id}`}`, margin, y);
  y += 14;
  pdf.setFontSize(10);
  pdf.text(`Date: ${String(invoice?.invoiceDate || invoice?.createdAt || "").slice(0, 10)}`, margin, y);
  pdf.text(`Customer: ${customer?.name || "Walk-in Customer"}`, margin, y + 14);
  y += 36;
  pdf.setFontSize(9);
  const cols = [margin, 250, 300, 360, 420, 480];
  const heads = ["Product", "Qty", "Price", "Disc.", "Tax", "Total"];
  heads.forEach((h, i) => pdf.text(h, cols[i], y));
  y += 12;
  for (const l of lines) {
    if (y > 760) { pdf.addPage(); y = 50; }
    pdf.text(String(l.productName || l.name || "Item").slice(0, 28), cols[0], y);
    pdf.text(String(l.quantity ?? ""), cols[1], y);
    pdf.text(Number(l.unitPrice ?? l.sellPrice ?? 0).toFixed(2), cols[2], y);
    pdf.text(Number(l.lineDiscount ?? 0).toFixed(2), cols[3], y);
    pdf.text(Number(l.lineTax ?? 0).toFixed(2), cols[4], y);
    pdf.text(Number(l.lineTotal ?? l.totalPrice ?? 0).toFixed(2), cols[5], y);
    y += 14;
  }
  y += 10;
  const right = (label, val) => { pdf.text(label, 380, y); pdf.text(Number(val || 0).toFixed(2), 480, y); y += 14; };
  right("Subtotal", invoice?.subtotal);
  right("Discount", invoice?.discount);
  right("Tax", invoice?.tax);
  right("Grand Total", invoice?.grandTotal ?? invoice?.totalAmount);
  right("Paid", invoice?.paidAmount);
  right("Balance", invoice?.balanceAmount);
  y += 6;
  pdf.setFontSize(9);
  pdf.text("Payment Information", margin, y);
  y += 12;
  pdf.setFontSize(8);
    pdf.text(`Invoice Total: $${Number(invoice?.grandTotal ?? invoice?.totalAmount ?? 0).toFixed(2)}`, margin, y);
  pdf.text(`Paid Amount: $${Number(invoice?.paidAmount ?? 0).toFixed(2)}`, margin, y + 10);
  pdf.text(`Remaining Balance: $${Number(invoice?.balanceAmount ?? 0).toFixed(2)}`, margin, y + 20);
  pdf.text(`Payment Method: ${payMethod}`, margin, y + 30);
  pdf.text(`Payment Date: ${payDate}`, margin, y + 40);
  pdf.text(`Reference: ${payRef}`, margin, y + 50);
  pdf.save(`${invoice?.invoiceNumber || `invoice-${invoice?.id}`}.pdf`);
}
