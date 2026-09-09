import { Printer, Download, X } from "lucide-react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { formatCurrency, formatDate } from "../../../utils/formatters";

/**
 * Transaction Receipt Component
 * Displays invoice details after successful transaction
 * Provides print and PDF download options
 */
export default function TransactionReceipt({
  open,
  onClose,
  transaction,
  cartItems,
  totals,
}) {
  if (!transaction) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(getReceiptHTML());
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Integrate with PDF library (e.g., jsPDF or pdfkit)
    alert("PDF download feature will be available soon");
  };

  const getReceiptHTML = () => {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transaction.invoice.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .bill-number { background: #f0f0f0; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { border-bottom: 2px solid #333; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .amount-col { text-align: right; }
          .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>RECEIPT</h1>
            <p>Thank you for your purchase!</p>
          </div>

          <div class="bill-number">#${transaction.invoice.billNumber}</div>

          <table>
            <tr>
              <td><strong>Date:</strong> ${formatDate(transaction.invoice.invoiceDate)}</td>
              <td><strong>Time:</strong> ${new Date().toLocaleTimeString()}</td>
            </tr>
            <tr>
              <td colspan="2"><strong>Customer:</strong> ${transaction.customer?.name || "Walk-in Customer"}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="amount-col">Qty</th>
                <th class="amount-col">Price</th>
                <th class="amount-col">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td class="amount-col">${item.quantity}</td>
                  <td class="amount-col">${formatCurrency(item.sellPrice)}</td>
                  <td class="amount-col">${formatCurrency(item.lineTotal)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(totals.subtotal)}</span>
            </div>
            ${
              totals.itemDiscount > 0
                ? `
              <div class="total-row" style="font-size: 14px;">
                <span>Item Discount:</span>
                <span>-${formatCurrency(totals.itemDiscount)}</span>
              </div>
            `
                : ""
            }
            ${
              totals.cartDiscount > 0
                ? `
              <div class="total-row" style="font-size: 14px;">
                <span>Bill Discount:</span>
                <span>-${formatCurrency(totals.cartDiscount)}</span>
              </div>
            `
                : ""
            }
            <div class="total-row" style="font-size: 14px;">
              <span>Tax:</span>
              <span>${formatCurrency(totals.taxAmount)}</span>
            </div>
            <div class="total-row" style="color: #000; border-top: 2px solid #333; margin-top: 15px; padding-top: 15px;">
              <span>GRAND TOTAL:</span>
              <span>${formatCurrency(totals.grandTotal)}</span>
            </div>
            <div class="total-row" style="font-size: 14px;">
              <span>Paid:</span>
              <span>${formatCurrency(transaction.payment?.amount || 0)}</span>
            </div>
            <div class="total-row" style="font-size: 14px;">
              <span>Balance:</span>
              <span>${formatCurrency(transaction.balance)}</span>
            </div>
            <div class="total-row" style="font-size: 14px;">
              <span>Method:</span>
              <span>${(transaction.payment?.method || "CASH").replace("_", " ")}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you! Please visit again.</p>
            <p style="margin-top: 20px; font-size: 10px;">Powered by BillApp</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return receiptHTML;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaction Complete"
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button icon={Printer} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Success Message */}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            ✓ {transaction.message}
          </p>
        </div>

        {/* Receipt Preview */}
        <Card className="p-6 bg-white">
          <div className="text-center mb-6 pb-6 border-b-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">RECEIPT</h3>
            <p className="text-sm text-gray-500">
              Thank you for your purchase!
            </p>
            <div className="mt-3 bg-gray-100 inline-block px-4 py-2 rounded-lg">
              <p className="font-mono font-semibold text-lg">
                #{transaction.invoice.billNumber}
              </p>
            </div>
          </div>

          {/* Bill Info */}
          <div className="space-y-1 text-sm mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {formatDate(transaction.invoice.invoiceDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">
                {transaction.customer?.name || "Walk-in Customer"}
              </span>
            </div>
          </div>

          {/* Cart Items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-700 pb-2">
                  Product
                </th>
                <th className="text-right text-xs font-semibold text-gray-700 pb-2">
                  Qty
                </th>
                <th className="text-right text-xs font-semibold text-gray-700 pb-2">
                  Price
                </th>
                <th className="text-right text-xs font-semibold text-gray-700 pb-2">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.productId} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-600">
                    {formatCurrency(item.sellPrice)}
                  </td>
                  <td className="text-right py-2 text-sm font-medium text-gray-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.itemDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Item Discount:</span>
                <span>-{formatCurrency(totals.itemDiscount)}</span>
              </div>
            )}
            {totals.cartDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Bill Discount:</span>
                <span>-{formatCurrency(totals.cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (10%):</span>
              <span className="font-medium">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Grand Total:</span>
              <span className="text-xl font-bold text-brand-600">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-medium">
                {formatCurrency(transaction.payment?.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span
                className={`font-medium ${
                  transaction.balance >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {transaction.balance >= 0 ? "Change: " : "Due: "}
                {formatCurrency(Math.abs(transaction.balance))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">
                {(transaction.payment?.method || "CASH").replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span
                className={`font-medium px-2 py-1 rounded-full text-xs ${
                  transaction.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-700"
                    : transaction.paymentStatus === "PARTIAL"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {transaction.paymentStatus}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Thank you for your business! Please visit again.
            </p>
            <p className="text-xs text-gray-400 mt-2">Powered by BillApp</p>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
