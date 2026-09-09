import { useMemo, useState, useEffect } from "react";
import { Eye, Printer, Download, Ban } from "lucide-react";
import ModuleIndexPage from "../../components/common/ModuleIndexPage";
import Button from "../../components/common/Button";
import DatePicker from "../../components/common/DatePicker";
import StatusBadge from "../../components/common/StatusBadge";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { cancelInvoice, getInvoices, normalizeInvoice } from "../../services/invoiceService";
import { getCustomers } from "../../services/customerService";
import { getPayments } from "../../services/paymentService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import InvoiceDetailModal from "./components/InvoiceDetailModal";
import { downloadInvoicePDF, printInvoiceDoc } from "../../components/invoices/invoicePrint";
import { getSettings } from "../../services/settingsService";

const COLUMNS = [
  { key: "invoiceNumber", header: "Invoice Number", render: (row) => row.invoiceNumber || `#${row.id}` },
  { key: "customer", header: "Customer", render: (row) => row.customer?.name || (row.customerId ? `#${row.customerId}` : "—") },
  { key: "invoiceDate", header: "Date", render: (row) => formatDate(row.invoiceDate || row.createdAt) },
  { key: "subtotal", header: "Subtotal", align: "right", render: (row) => formatCurrency(row.subtotal) },
  { key: "tax", header: "Tax", align: "right", render: (row) => formatCurrency(row.tax) },
  { key: "grandTotal", header: "Total", align: "right", render: (row) => formatCurrency(row.grandTotal ?? row.totalAmount) },
  { key: "paymentStatus", header: "Payment Status", render: (row) => <StatusBadge status={row.paymentStatus} /> },
  { key: "invoiceStatus", header: "Invoice Status", render: (row) => <StatusBadge status={row.invoiceStatus} /> },
];
const SORT_OPTIONS = [
  { label: "Newest first", value: "invoiceDate", order: "desc" },
  { label: "Oldest first", value: "invoiceDate", order: "asc" },
  { label: "Total (high to low)", value: "grandTotal", order: "desc" },
  { label: "Total (low to high)", value: "grandTotal", order: "asc" },
];
async function fetchInvoices(params) {
  const res = await getInvoices(params);
  return { ...res, data: (res.data || []).map(normalizeInvoice) };
}


export default function InvoicesPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customers, setCustomers] = useState([]);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    getCustomers({ _limit: 200, _sort: "name", _order: "asc" })
      .then(({ data }) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
    getSettings().then(({ data }) => setBusiness(data)).catch(() => setBusiness(null));
  }, []);

  const baseParams = useMemo(() => {
    const p = {};
    if (fromDate) p.invoiceDate_gte = new Date(`${fromDate}T00:00:00`).toISOString();
    if (toDate) p.invoiceDate_lte = new Date(`${toDate}T23:59:59`).toISOString();
    return p;
  }, [fromDate, toDate]);

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
  const handleView = (row) => { setSelected(row); setShowDetail(true); };
  const handleCancel = async (row) => {
    const ok = await confirm({
      title: "Cancel Invoice",
      message: `Cancel invoice ${row.invoiceNumber || `#${row.id}`}? It will be marked CANCELLED and excluded from active billing. This cannot be undone.`,
      confirmText: "Cancel Invoice",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await cancelInvoice(row.id);
      toast.success("Invoice cancelled successfully");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(`Failed to cancel invoice: ${error.message}`);
    }
  };
  const quickDoc = (row) => ({ invoice: row, items: row.items || [], customer: customers.find((c) => c.id === row.customerId) || row.customer || null, business, payments: [] });
  const rowActions = (row) => (
    <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => handleView(row)} title="View invoice" />
      <Button size="sm" variant="ghost" icon={Printer} onClick={async () => { const res = await getPayments({ invoiceId: row.id }); const doc = { ...quickDoc(row), payments: Array.isArray(res.data) ? res.data : [] }; printInvoiceDoc(doc); }} title="Print invoice" />
      <Button size="sm" variant="ghost" icon={Download} onClick={async () => { const res = await getPayments({ invoiceId: row.id }); const doc = { ...quickDoc(row), payments: Array.isArray(res.data) ? res.data : [] }; downloadInvoicePDF(doc); }} title="Download PDF" />
      <Button size="sm" variant="ghost" icon={Ban} onClick={() => handleCancel(row)} title="Cancel invoice" disabled={row.invoiceStatus === "CANCELLED"} />
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ModuleIndexPage title="Invoices" description="Create, view and manage customer invoices and PDF downloads." getData={fetchInvoices} columns={COLUMNS} baseParams={baseParams}
            filters={[
              { key: "customerId", label: "Customer", placeholder: "All customers", options: customerOptions, className: "w-48" },
              { key: "paymentStatus", label: "Payment status", placeholder: "All payment states", options: [{ value: "PAID", label: "Paid" }, { value: "PARTIAL", label: "Partial" }, { value: "UNPAID", label: "Unpaid" }], className: "w-44" },
              { key: "invoiceStatus", label: "Invoice status", placeholder: "All invoice states", options: [{ value: "ACTIVE", label: "Active" }, { value: "CANCELLED", label: "Cancelled" }], className: "w-44" },
            ]}
            sortOptions={SORT_OPTIONS} searchPlaceholder="Search invoices…" defaultSort="invoiceDate" defaultOrder="desc"
            emptyTitle="No invoices yet" emptyDescription="Invoices created from the POS will appear here."
            rowActions={rowActions} actionHeader="Actions" refreshKey={refreshKey} />
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900">Date Filter</h3>
            <p className="mt-0.5 text-sm text-gray-500">Filter invoices by invoice date.</p>
            <div className="mt-4 space-y-3">
              <DatePicker label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <DatePicker label="To" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
              {(fromDate || toDate) && (<Button variant="secondary" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>Clear dates</Button>)}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900">Print & PDF</h3>
            <p className="mt-1 text-sm text-gray-500">Open any invoice and use Print / PDF in the detail footer. Both outputs render through the same reusable InvoiceView.</p>
          </div>
        </div>
      </div>
      {selected && (<InvoiceDetailModal open={showDetail} onClose={() => setShowDetail(false)} invoiceId={selected.id} />)}
    </>
  );
}
