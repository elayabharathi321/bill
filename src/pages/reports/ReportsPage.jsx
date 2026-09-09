import { useState } from 'react';
import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/common/Tabs';
import StatusBadge from '../../components/common/StatusBadge';
import * as reportService from '../../services/reportService';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Stable report tabs. Each tab is its own ModuleIndexPage configuration,
// so switching tabs swaps the underlying service getter and columns.
const REPORT_TABS = [
  {
    value: 'sales',
    label: 'Sales',
    getData: reportService.getSalesReport,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'invoiceNumber', header: 'Invoice' },
      { key: 'invoiceDate', header: 'Date', render: (row) => formatDate(row.invoiceDate) },
      { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    defaultSort: 'invoiceDate',
    defaultOrder: 'desc',
    searchPlaceholder: 'Search invoices…',
    emptyTitle: 'No sales yet',
    emptyDescription: 'Completed invoices will appear in the sales report.',
  },
  {
    value: 'payments',
    label: 'Payments',
    getData: reportService.getPaymentsReport,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'invoiceId', header: 'Invoice', render: (row) => `#${row.invoiceId}` },
      { key: 'paymentDate', header: 'Date', render: (row) => formatDate(row.paymentDate) },
      { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount) },
      { key: 'method', header: 'Method', render: (row) => (row.method || '—').replace('_', ' ') },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    defaultSort: 'paymentDate',
    defaultOrder: 'desc',
    searchPlaceholder: 'Search payments…',
    emptyTitle: 'No payments yet',
    emptyDescription: 'Recorded payments will appear in the payments report.',
  },
  {
    value: 'inventory',
    label: 'Inventory',
    getData: reportService.getInventoryReport,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Product' },
      { key: 'sku', header: 'SKU' },
      { key: 'stockQuantity', header: 'Stock', align: 'right' },
      { key: 'sellingPrice', header: 'Price', align: 'right', render: (row) => formatCurrency(row.sellingPrice) },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    defaultSort: 'name',
    defaultOrder: 'asc',
    searchPlaceholder: 'Search products…',
    emptyTitle: 'No inventory data',
    emptyDescription: 'Products with stock levels will appear in the inventory report.',
  },
  {
    value: 'customers',
    label: 'Customers',
    getData: reportService.getCustomersReport,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'loyaltyPoints', header: 'Loyalty', align: 'right' },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    defaultSort: 'name',
    defaultOrder: 'asc',
    searchPlaceholder: 'Search customers…',
    emptyTitle: 'No customer data',
    emptyDescription: 'Customer records will appear in the customers report.',
  },
  {
    value: 'purchases',
    label: 'Purchases',
    getData: reportService.getPurchaseReport,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'invoiceNumber', header: 'PO Ref' },
      { key: 'purchaseDate', header: 'Date', render: (row) => formatDate(row.purchaseDate) },
      { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    defaultSort: 'purchaseDate',
    defaultOrder: 'desc',
    searchPlaceholder: 'Search purchases…',
    emptyTitle: 'No purchase data',
    emptyDescription: 'Purchase orders will appear in the purchases report.',
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const active = REPORT_TABS.find((tab) => tab.value === activeTab) || REPORT_TABS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Sales, inventory and financial analytics. Charts and exports are coming soon."
      />
      <Tabs
        tabs={REPORT_TABS.map(({ value, label }) => ({ value, label }))}
        active={activeTab}
        onChange={setActiveTab}
      />
      {/* `key` forces a fresh fetch when switching report tabs */}
      <ModuleIndexPage key={active.value} {...active} hideHeader />
    </div>
  );
}