import { capitalize } from '../../utils/formatters';
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STOCK_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '../../utils/constants';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  draft: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  received: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  purchase: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  sale: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  adjustment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  return: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  // Uppercase transaction types (inventory module)
  PURCHASE: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  SALE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  RETURN: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  ADJUSTMENT_IN: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  ADJUSTMENT_OUT: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  // Stock statuses (inventory module)
  IN_STOCK: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  LOW_STOCK: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  OUT_OF_STOCK: 'bg-red-50 text-red-700 ring-red-600/20',
  // Payment module statuses (spec: PAID / PARTIAL / UNPAID / REFUNDED)
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  UNPAID: 'bg-red-50 text-red-700 ring-red-600/20',
  REFUNDED: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  // Invoice lifecycle statuses (spec: ACTIVE / CANCELLED)
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
};

/**
 * Colored status pill.
 */
export default function StatusBadge({ status, label }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600 ring-gray-500/20';
  const fallbackLabel =
    INVOICE_STATUS_LABELS[status] ||
    PAYMENT_STATUS_LABELS[status] ||
    STOCK_STATUS_LABELS[status] ||
    TRANSACTION_TYPE_LABELS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label || fallbackLabel || capitalize(status)}
    </span>
  );
}