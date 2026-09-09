import { useCallback, useEffect, useState } from "react";
import { FileText, Calendar, DollarSign, TrendingUp } from "lucide-react";
import Modal from "../../../components/common/Modal";
import Card from "../../../components/common/Card";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import StatusBadge from "../../../components/common/StatusBadge";
import { useToast } from "../../../components/common/Toast";
import {
  getCustomerById,
  getCustomerInvoices,
  getCustomerStats,
} from "../../../services/customerService";
import { formatCurrency, formatDate } from "../../../utils/formatters";

/**
 * Customer Detail Modal
 * Displays customer information, stats, and purchase history
 */
export default function CustomerDetailModal({ open, onClose, customerId }) {
  const toast = useToast();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!open || !customerId) return;
    setLoading(true);
    setError(null);
    try {
      const [customerRes, statsRes, history] = await Promise.all([
        getCustomerById(customerId),
        getCustomerStats(customerId),
        getCustomerInvoices(customerId),
      ]);

      setCustomer(customerRes.data);
      setStats(statsRes);
      setInvoices(Array.isArray(history) ? history : []);
    } catch (err) {
      setError(`Failed to load customer details: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, customerId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!customer && loading) {
    return (
      <Modal open={open} onClose={onClose} title="Customer Details" size="xl">
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        customer ? `${customer.name} - Customer Details` : "Customer Details"
      }
      size="xl"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {error ? (
        <ErrorState
          title="Error Loading Details"
          description={error}
          onRetry={loadData}
        />
      ) : customer ? (
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {customer.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Email</p>
                <p className="text-sm text-gray-900">{customer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Phone</p>
                <p className="text-sm text-gray-900">{customer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">GST Number</p>
                <p className="text-sm text-gray-900">
                  {customer.gstNumber || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-600">Address</p>
                <p className="text-sm text-gray-900">
                  {customer.address ? (
                    <>
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && `, ${customer.state}`}
                      {customer.postalCode && ` ${customer.postalCode}`}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-600">
                  Member Since
                </p>
                <p className="text-sm text-gray-900">
                  {customer.createdAt ? formatDate(customer.createdAt) : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <StatBox
                icon={DollarSign}
                label="Total Purchases"
                value={formatCurrency(stats.totalPurchases)}
                color="blue"
              />
              <StatBox
                icon={FileText}
                label="Total Invoices"
                value={stats.totalInvoices.toString()}
                color="green"
              />
              <StatBox
                icon={TrendingUp}
                label="Total Paid"
                value={formatCurrency(stats.totalPaid)}
                color="emerald"
              />
              <StatBox
                icon={DollarSign}
                label="Outstanding"
                value={formatCurrency(stats.outstandingAmount)}
                color={stats.outstandingAmount > 0 ? "red" : "gray"}
              />
            </div>
          )}

          {/* Purchase History */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Purchase History
            </h3>

            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No invoices found for this customer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Invoice #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Paid
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Balance
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((row, idx) => (
                        <tr
                          key={row.raw?.id ?? idx}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            {row.invoice}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDate(row.date)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 font-medium">
                            {formatCurrency(row.amount || 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                            {formatCurrency(row.paid || 0)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-medium ${
                              (row.balance || 0) > 0 ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {formatCurrency(row.balance || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </Modal>
  );
}

/**
 * Stat Box Component
 */
function StatBox({ icon: Icon, label, value, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 ring-blue-200",
    green: "bg-green-50 text-green-600 ring-green-200",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    red: "bg-red-50 text-red-600 ring-red-200",
    gray: "bg-gray-50 text-gray-600 ring-gray-200",
  };

  return (
    <Card className={`p-4 ring-1 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </Card>
  );
}
