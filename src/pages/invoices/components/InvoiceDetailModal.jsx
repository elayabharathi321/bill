import { useCallback, useEffect, useState } from "react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { useToast } from "../../../components/common/Toast";
import { getInvoiceById, getInvoiceItems } from "../../../services/invoiceService";
import { getPayments } from "../../../services/paymentService";
import { getSettings } from "../../../services/settingsService";
import InvoiceView from "../../../components/invoices/InvoiceView";
import { downloadInvoicePDF, printInvoiceDoc } from "../../../components/invoices/invoicePrint";
import { Printer, Download } from "lucide-react";

/** Print / PDF buttons sharing one invoice document (screen ≡ print ≡ PDF). */
function InvoiceActions({ doc }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => printInvoiceDoc(doc)} title="Print invoice"><Printer className="h-4 w-4" /> Print</Button>
      <Button variant="secondary" size="sm" onClick={() => downloadInvoicePDF(doc)} title="Download PDF"><Download className="h-4 w-4" /> PDF</Button>
    </div>
  );
}

/** Invoice Details modal — renders the reusable InvoiceView (screen/print/PDF). */
export default function InvoiceDetailModal({ open, onClose, invoiceId }) {
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [business, setBusiness] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!open || !invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: inv } = await getInvoiceById(invoiceId);
      setInvoice(inv);
      const itemsRes = await getInvoiceItems(invoiceId);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      let cust = null;
      if (inv?.customerId != null) {
        try {
          const { getCustomerById } = await import("../../../services/customerService");
          cust = (await getCustomerById(inv.customerId)).data;
        } catch { cust = null; }
      }
      setCustomer(cust);
      try {
        const res = await getPayments({ invoiceId });
        setPayments(Array.isArray(res.data) ? res.data : []);
      } catch { setPayments([]); }
      try {
        setBusiness((await getSettings()).data);
      } catch { setBusiness(null); }
    } catch (err) {
      setError(`Failed to load invoice details: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, invoiceId, toast]);

  useEffect(() => { loadData(); }, [loadData]);
  const doc = { invoice, items, customer, business, payments };

  if (!invoice && loading) {
    return (<Modal open={open} onClose={onClose} title="Invoice Details" size="xl"><div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-40" /></div></Modal>);
  }

  return (
    <Modal open={open} onClose={onClose} title={invoice ? `Invoice ${invoice.invoiceNumber || `#${invoice.id}`}` : "Invoice Details"} size="xl"
      footer={<div className="flex items-center gap-2"><InvoiceActions doc={doc} /><Button onClick={onClose}>Close</Button></div>}>
      {error ? (<ErrorState title="Error Loading Details" description={error} onRetry={loadData} />) : invoice ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.paymentStatus} />
            <StatusBadge status={invoice.invoiceStatus} />
          </div>
          <InvoiceView invoice={invoice} items={items} customer={customer} business={business} payments={payments} />
        </div>
      ) : null}
    </Modal>
  );
}
