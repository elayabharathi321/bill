import { useState } from "react";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import ModuleIndexPage from "../../components/common/ModuleIndexPage";
import Button from "../../components/common/Button";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { getCustomers, deleteCustomer } from "../../services/customerService";
import { formatCurrency, formatDate } from "../../utils/formatters";

import CustomerForm from "./components/CustomerForm";
import CustomerDetailModal from "./components/CustomerDetailModal";

// Stable references (see ModuleIndexPage contract).
const COLUMNS = [
  { key: "id", header: "ID", width: "60px" },
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
  { key: "email", header: "Email", render: (row) => row.email || "—" },
  { key: "city", header: "City", render: (row) => row.city || "—" },
  {
    key: "totalPurchases",
    header: "Total Purchases",
    align: "right",
    render: (row) => formatCurrency(row.totalPurchases || 0),
  },
  {
    key: "outstandingAmount",
    header: "Outstanding",
    align: "right",
    render: (row) => (
      <span
        className={
          (row.outstandingAmount || 0) > 0
            ? "text-red-600 font-medium"
            : "text-emerald-600 font-medium"
        }
      >
        {formatCurrency(row.outstandingAmount || 0)}
      </span>
    ),
  },
];

const BASE_PARAMS = {};

const FILTERS = [
  {
    key: "city",
    label: "City",
    placeholder: "All cities",
    options: [
      { value: "Austin", label: "Austin" },
      { value: "Dallas", label: "Dallas" },
      { value: "Houston", label: "Houston" },
      { value: "San Antonio", label: "San Antonio" },
      { value: "Fort Worth", label: "Fort Worth" },
    ],
    className: "w-44",
  },
  {
    key: "state",
    label: "State",
    placeholder: "All states",
    options: [{ value: "TX", label: "TX" }],
    className: "w-36",
  },
];

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name", order: "asc" },
  { label: "Name (Z-A)", value: "name", order: "desc" },
  { label: "Total purchases (high to low)", value: "totalPurchases", order: "desc" },
  { label: "Total purchases (low to high)", value: "totalPurchases", order: "asc" },
  { label: "Outstanding (high to low)", value: "outstandingAmount", order: "desc" },
  { label: "Newest first", value: "createdAt", order: "desc" },
  { label: "Oldest first", value: "createdAt", order: "asc" },
];

export default function CustomersPage() {
  const confirm = useConfirm();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customer) => {
    const ok = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!ok) return;

    setIsDeleting(true);
    try {
      await deleteCustomer(customer.id);
      toast.success(`Customer "${customer.name}" deleted successfully`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(`Failed to delete customer: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowDetail(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCustomer(null);
    setRefreshKey((k) => k + 1);
    toast.success(
      selectedCustomer
        ? "Customer updated successfully"
        : "Customer created successfully",
    );
  };

  const rowActions = (row) => (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        icon={Eye}
        onClick={() => handleView(row)}
        title="View details"
      />
      <Button
        size="sm"
        variant="ghost"
        icon={Edit2}
        onClick={() => handleEdit(row)}
        title="Edit"
      />
      <Button
        size="sm"
        variant="ghost"
        icon={Trash2}
        onClick={() => handleDelete(row)}
        disabled={isDeleting}
        title="Delete"
      />
    </div>
  );

  return (
    <>
      <ModuleIndexPage
        title="Customers"
        description="Maintain customer records, loyalty points and purchase history."
        getData={getCustomers}
        columns={COLUMNS}
        baseParams={BASE_PARAMS}
        filters={FILTERS}
        sortOptions={SORT_OPTIONS}
        searchPlaceholder="Search customers by name, phone or email…"
        defaultSort="name"
        defaultOrder="asc"
        emptyTitle="No customers yet"
        emptyDescription="Customers will appear here once they are added during billing."
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add Customer
          </Button>
        }
        rowActions={rowActions}
        actionHeader="Actions"
        refreshKey={refreshKey}
      />

      {/* Add/Edit Form */}
      <CustomerForm
        open={showForm}
        onClose={handleFormClose}
        customer={selectedCustomer}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          open={showDetail}
          onClose={() => setShowDetail(false)}
          customerId={selectedCustomer.id}
        />
      )}
    </>
  );
}
