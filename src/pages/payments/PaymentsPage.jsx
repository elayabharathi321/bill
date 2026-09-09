import { useMemo, useState } from "react";
import { Plus, Edit2, Eye, Undo2 } from "lucide-react";
import ModuleIndexPage from "../../components/common/ModuleIndexPage";
import Button from "../../components/common/Button";
import DatePicker from "../../components/common/DatePicker";
import StatusBadge from "../../components/common/StatusBadge";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { getPayments, normalizePayment, refundPayment } from "../../services/paymentService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import PaymentForm from "./components/PaymentForm";
import PaymentDetailModal from "./components/PaymentDetailModal";
import OutstandingPanel from "./components/OutstandingPanel";

const COLUMNS = [
  { key: "id", header: "ID", width: "60px" },
  { key: "invoiceId", header: "Invoice", render: (row) => (row.invoiceId ? `#${row.invoiceId}` : "—") },
  { key: "customerId", header: "Customer", render: (row) => (row.customerId ? `#${row.customerId}` : "—") },
  { key: "amount", header: "Amount", align: "right", render: (row) => formatCurrency(row.amount) },
  { key: "method", header: "Method", render: (row) => (row.method || "—").replace("_", " ") },
  { key: "txRef", header: "Reference", render: (row) => row.transactionReference || row.reference || "—" },
  { key: "paymentDate", header: "Date", render: (row) => formatDate(row.paymentDate) },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
];
const BASE_PARAMS = {};
const METHOD_FILTER = [{ value: "CASH", label: "Cash" }, { value: "UPI", label: "UPI" }, { value: "CARD", label: "Card" }, { value: "BANK_TRANSFER", label: "Bank Transfer" }, { value: "CREDIT", label: "Credit" }];
const STATUS_FILTER = [{ value: "PAID", label: "Paid" }, { value: "PARTIAL", label: "Partial" }, { value: "UNPAID", label: "Unpaid" }, { value: "REFUNDED", label: "Refunded" }];
const SORT_OPTIONS = [
  { label: "Newest first", value: "paymentDate", order: "desc" },
  { label: "Oldest first", value: "paymentDate", order: "asc" },
  { label: "Amount (high to low)", value: "amount", order: "desc" },
  { label: "Amount (low to high)", value: "amount", order: "asc" },
];
async function fetchPayments(params) {
  const res = await getPayments(params);
  return { ...res, data: (res.data || []).map(normalizePayment) };
}

export default function PaymentsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const baseParams = useMemo(() => {
    const p = { ...BASE_PARAMS };
    if (fromDate) p.paymentDate_gte = new Date(`${fromDate}T00:00:00`).toISOString();
    if (toDate) p.paymentDate_lte = new Date(`${toDate}T23:59:59`).toISOString();
    return p;
  }, [fromDate, toDate]);

  const handleAdd = () => { setSelected(null); setShowForm(true); };
  const handleEdit = (row) => { setSelected(row); setShowForm(true); };
  const handleView = (row) => { setSelected(row); setShowDetail(true); };
  const handleFormSuccess = () => {
    setShowForm(false); setSelected(null); setRefreshKey((k) => k + 1);
    toast.success(selected?.id ? "Payment updated successfully" : "Payment recorded successfully");
  };
  const handleRefund = async (row) => {
    const ok = await confirm({
      title: "Refund / Reverse Payment",
      message: `Reverse payment #${row.id} of ${formatCurrency(row.amount)}? It will be marked REFUNDED and excluded from paid totals. This cannot be undone.`,
      confirmText: "Refund Payment",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await refundPayment(row.id, { notes: [row.notes, "Refunded via Payments page."].filter(Boolean).join(" ") });
      toast.success(`Payment #${row.id} refunded successfully`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(`Failed to refund payment: ${error.message}`);
    }
  };
  const rowActions = (row) => (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" icon={Eye} onClick={() => handleView(row)} title="View details" />
      <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleEdit(row)} title="Edit" disabled={row.status === "REFUNDED"} />
      <Button size="sm" variant="ghost" icon={Undo2} onClick={() => handleRefund(row)} title="Refund / reverse" disabled={row.status === "REFUNDED"} />
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ModuleIndexPage title="Payments" description="Record and track payments against invoices." getData={fetchPayments} columns={COLUMNS} baseParams={baseParams}
            filters={[
              { key: "method", label: "Method", placeholder: "All methods", options: METHOD_FILTER, className: "w-44" },
              { key: "status", label: "Status", placeholder: "All statuses", options: STATUS_FILTER, className: "w-40" },
            ]}
            sortOptions={SORT_OPTIONS} searchPlaceholder="Search payments…" defaultSort="paymentDate" defaultOrder="desc"
            emptyTitle="No payments yet" emptyDescription="Payments recorded against invoices will appear here."
            actions={<Button icon={Plus} onClick={handleAdd}>Record Payment</Button>}
            rowActions={rowActions} actionHeader="Actions" refreshKey={refreshKey} />
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900">Date Filter</h3>
            <p className="mt-0.5 text-sm text-gray-500">Filter payments by payment date.</p>
            <div className="mt-4 space-y-3">
              <DatePicker label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <DatePicker label="To" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
              {(fromDate || toDate) && (<Button variant="secondary" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>Clear dates</Button>)}
            </div>
          </div>
          <OutstandingPanel refreshKey={refreshKey} />
        </div>
      </div>
      <PaymentForm open={showForm} onClose={() => { setShowForm(false); setSelected(null); }} payment={selected} onSuccess={handleFormSuccess} />
      {selected && (<PaymentDetailModal open={showDetail} onClose={() => setShowDetail(false)} paymentId={selected.id} />)}
    </>
  );
}
