import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Textarea from "../../../components/common/Textarea";
import DatePicker from "../../../components/common/DatePicker";
import Button from "../../../components/common/Button";
import { useToast } from "../../../components/common/Toast";
import { createPayment, getPayments, updatePayment } from "../../../services/paymentService";
import { getInvoices } from "../../../services/invoiceService";
import { validators } from "../../../utils/validators";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUSES } from "../../../utils/constants";
import { calculateRemainingBalance, round } from "../../../utils/calculations";
import { formatCurrency } from "../../../utils/formatters";

const FORM_DEFAULTS = {
  invoiceId: "",
  amount: "",
  method: "CASH",
  status: "PAID",
  transactionReference: "",
  paymentDate: "",
  notes: "",
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

/** Record a new payment or update an existing one. */
export default function PaymentForm({ open, onClose, payment, onSuccess }) {
  const toast = useToast();
  const form = useForm({ mode: "onBlur", defaultValues: { ...FORM_DEFAULTS, paymentDate: todayInput() } });
  const { register, handleSubmit, reset, watch, setValue } = form;
  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;
  const [invoices, setInvoices] = useState([]);
  const [paidForInvoice, setPaidForInvoice] = useState(0);
  const watchedInvoiceId = watch("invoiceId");
  const watchedAmount = watch("amount");

  useEffect(() => {
    if (!open) return;
    getInvoices({ _sort: "invoiceDate", _order: "desc", _limit: 200 })
      .then(({ data }) => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (payment?.id) {
      reset({
        invoiceId: String(payment.invoiceId ?? ""),
        amount: payment.amount ?? "",
        method: payment.method || "CASH",
        status: payment.status || "PAID",
        transactionReference: payment.transactionReference || payment.reference || "",
        paymentDate: (payment.paymentDate || "").slice(0, 10),
        notes: payment.notes || "",
      });
    } else {
      reset({ ...FORM_DEFAULTS, paymentDate: todayInput() });
    }
  }, [open, payment, reset]);

  useEffect(() => {
    if (!watchedInvoiceId) { setPaidForInvoice(0); return; }
    getPayments({ invoiceId: Number(watchedInvoiceId) })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setPaidForInvoice(list
          .filter((p) => String(p.status || "").toUpperCase() !== "REFUNDED")
          .filter((p) => (payment?.id ? p.id !== payment.id : true))
          .reduce((s, p) => s + (Number(p.amount) || 0), 0));
      })
      .catch(() => setPaidForInvoice(0));
  }, [watchedInvoiceId, payment?.id]);

  const selectedInvoice = invoices.find((i) => String(i.id) === String(watchedInvoiceId)) || null;
  const invoiceTotal = Number(selectedInvoice?.totalAmount) || 0;
  const remaining = selectedInvoice ? calculateRemainingBalance(invoiceTotal, paidForInvoice) : null;

  const onSubmit = async (formData) => {
    const amount = round(Number(formData.amount) || 0);
    if (remaining != null && amount > remaining) {
      toast.error(`Amount exceeds remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }
    try {
      const payload = { ...formData, invoiceId: Number(formData.invoiceId), amount };
      if (payment?.id) await updatePayment(payment.id, payload);
      else await createPayment(payload);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to save payment: ${error.message}`);
    }
  };

  const amountValidator = (v) => {
    const req = validators.required()(v);
    if (req !== true) return req;
    return validators.positive()(v);
  };
  const statusOptions = PAYMENT_STATUSES.filter((s) => s !== "REFUNDED").map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }));
  const invoiceOptions = invoices.map((inv) => ({ value: inv.id, label: `${inv.invoiceNumber || `#${inv.id}`} — ${formatCurrency(inv.totalAmount)}` }));
  const amountHint = watchedAmount && remaining != null && Number(watchedAmount) > remaining ? `Exceeds remaining ${formatCurrency(remaining)}` : undefined;

  return (
    <Modal open={open} onClose={onClose} title={payment?.id ? "Update Payment" : "Record Payment"} description="Record a payment against an invoice." size="lg"
      footer={<><Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{payment?.id ? "Update" : "Record"} Payment</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Invoice *" placeholder="Select an invoice" options={invoiceOptions} {...register("invoiceId", { validate: validators.required() })} error={errors.invoiceId?.message} disabled={Boolean(payment?.id)} />
        {selectedInvoice && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-gray-50 p-3 text-sm">
            <span className="text-gray-600">Total: <strong className="text-gray-900">{formatCurrency(invoiceTotal)}</strong></span>
            <span className="text-gray-600">Paid: <strong className="text-gray-900">{formatCurrency(paidForInvoice)}</strong></span>
            <span className="text-gray-600">Remaining: <strong className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>{formatCurrency(remaining)}</strong></span>
            {remaining > 0 && !payment?.id && (<button type="button" onClick={() => setValue("amount", remaining, { shouldValidate: true })} className="font-medium text-brand-600 hover:underline">Fill remaining</button>)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount *" type="number" min="0" step="0.01" placeholder="0.00" {...register("amount", { validate: amountValidator })} error={errors.amount?.message} hint={amountHint} />
          <Select label="Method *" options={PAYMENT_METHOD_OPTIONS} {...register("method", { validate: validators.required() })} error={errors.method?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status *" options={statusOptions} {...register("status", { validate: validators.required() })} error={errors.status?.message} />
          <DatePicker label="Payment Date *" {...register("paymentDate", { validate: validators.required() })} error={errors.paymentDate?.message} />
        </div>
        <Input label="Transaction Reference" placeholder="TXN-… / UPI ref / cheque no." {...register("transactionReference")} error={errors.transactionReference?.message} />
        <Textarea label="Notes" placeholder="Optional note" rows={2} {...register("notes")} error={errors.notes?.message} />
      </form>
    </Modal>
  );
}
