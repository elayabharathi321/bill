import { useCallback, useEffect, useState } from "react";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { useToast } from "../../../components/common/Toast";
import { getPaymentById } from "../../../services/paymentService";
import { calculateInvoicePaymentSummary } from "../../../utils/calculations";
import { getPayments } from "../../../services/paymentService";
import api from "../../../services/api";

function Row({ label, value, strong, danger }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className={`text-sm ${strong ? "font-semibold" : ""} ${danger ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

/** Payment Details modal: Invoice, Customer, Totals, Method, Date, Reference. */
export default function PaymentDetailModal({ open, onClose, paymentId }) {
  const toast = useToast();
  const [payment, setPayment] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!open || !paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: pay } = await getPaymentById(paymentId);
      setPayment(pay);
      let inv = null;
      try {
        const res = await api.get(`/invoices/${pay.invoiceId}`);
        inv = res.data;
      } catch { inv = null; }
      setInvoice(inv);
      let cust = null;
      const cid = pay.customerId ?? inv?.customerId;
      if (cid != null) {
        try {
          const res = await api.get(`/customers/${cid}`);
          cust = res.data;
        } catch { cust = null; }
      }
      setCustomer(cust);
      let allForInvoice = [];
      try {
        const res = await getPayments({ invoiceId: pay.invoiceId });
        allForInvoice = Array.isArray(res.data) ? res.data : [];
      } catch { allForInvoice = []; }
      setSummary(calculateInvoicePaymentSummary(Number(inv?.totalAmount) || 0, allForInvoice));
    } catch (err) {
      setError(`Failed to load payment details: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, paymentId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!payment && loading) {
    return (<Modal open={open} onClose={onClose} title="Payment Details" size="lg"><div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-40" /></div></Modal>);
  }

  return (
    <Modal open={open} onClose={onClose} title="Payment Details" size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      {error ? (<ErrorState title="Error Loading Details" description={error} onRetry={loadData} />) : payment ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Payment #{payment.id}</h3>
              <StatusBadge status={payment.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Invoice" value={invoice?.invoiceNumber || (payment.invoiceId ? `#${payment.invoiceId}` : "—")} strong />
              <Row label="Customer" value={customer?.name || (payment.customerId ? `#${payment.customerId}` : "—")} strong />
              <Row label="Invoice Total" value={formatCurrency(summary?.invoiceTotal ?? invoice?.totalAmount ?? 0)} />
              <Row label="Paid Amount" value={formatCurrency(summary?.paidAmount ?? payment.amount ?? 0)} />
              <Row label="Remaining Balance" value={formatCurrency(summary?.remainingBalance ?? 0)} danger={(summary?.remainingBalance ?? 0) > 0} />
              <Row label="Payment Method" value={String(payment.method || "—").replace("_", " ")} />
              <Row label="Payment Date" value={payment.paymentDate ? formatDate(payment.paymentDate) : "—"} />
              <Row label="Reference" value={payment.transactionReference || payment.reference || "—"} />
            </div>
            {payment.notes && (<div className="mt-4"><p className="text-xs font-medium text-gray-600">Notes</p><p className="text-sm text-gray-900">{payment.notes}</p></div>)}
          </Card>
        </div>
      ) : null}
    </Modal>
  );
}
