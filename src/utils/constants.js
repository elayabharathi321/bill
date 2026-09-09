// Shared application constants.
// Keep navigation config and status metadata here so it can be reused
// by the sidebar, header, tables and badge components.

import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Tags,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  CreditCard,
  Undo2,
  BarChart3,
  ShieldCheck,
  History,
  Bell,
  Settings,
} from "lucide-react";

export const APP_NAME = "BillApp";

/**
 * Ordered navigation groups rendered as section labels in the sidebar.
 */
export const NAV_GROUPS = [
  "Overview",
  "Sales",
  "Catalog",
  "Purchasing",
  "People",
  "Analytics",
  "System",
];

/**
 * Single source of truth for module navigation.
 * Each entry carries sidebar metadata (`icon`, `group`) and page
 * metadata (`description`) so pages, the sidebar and the header
 * stay in sync with one file.
 */
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    permission: "dashboard",
    icon: LayoutDashboard,
    group: "Overview",
    description: "Business overview, key metrics and recent activity.",
  },
  {
    label: "Billing / POS",
    path: "/billing",
    permission: "billing",
    icon: ShoppingCart,
    group: "Sales",
    description:
      "Point of sale interface for creating bills and accepting payments.",
  },
  {
    label: "Invoices",
    path: "/invoices",
    permission: "invoices",
    icon: FileText,
    group: "Sales",
    description: "Create, view and manage customer invoices and PDF downloads.",
  },
  {
    label: "Payments",
    path: "/payments",
    permission: "payments",
    icon: CreditCard,
    group: "Sales",
    description: "Track incoming and outgoing payments against invoices.",
  },
  {
    label: "Returns",
    path: "/returns",
    permission: "returns",
    icon: Undo2,
    group: "Sales",
    description: "Process product returns, refunds and restocking.",
  },
  {
    label: "Products",
    path: "/products",
    permission: "products",
    icon: Package,
    group: "Catalog",
    description: "Manage the product catalogue, pricing and stock levels.",
  },
  {
    label: "Categories",
    path: "/categories",
    permission: "categories",
    icon: Tags,
    group: "Catalog",
    description:
      "Organize products into categories for easier browsing and reporting.",
  },
  {
    label: "Inventory",
    path: "/inventory",
    permission: "inventory",
    icon: Boxes,
    group: "Catalog",
    description: "Track stock movements, adjustments and low-stock alerts.",
  },
  {
    label: "Suppliers",
    path: "/suppliers",
    permission: "suppliers",
    icon: Truck,
    group: "Purchasing",
    description: "Manage supplier information and purchase relationships.",
  },
  {
    label: "Purchases",
    path: "/purchases",
    permission: "purchases",
    icon: ShoppingBag,
    group: "Purchasing",
    description: "Record purchase orders and stock incoming from suppliers.",
  },
  {
    label: "Customers",
    path: "/customers",
    permission: "customers",
    icon: Users,
    group: "People",
    description:
      "Maintain customer records, loyalty points and purchase history.",
  },
  {
    label: "Users",
    path: "/users",
    permission: "users",
    icon: ShieldCheck,
    group: "People",
    description: "Manage user accounts, roles and access permissions.",
  },
  {
    label: "Reports",
    path: "/reports",
    permission: "reports",
    icon: BarChart3,
    group: "Analytics",
    description:
      "Sales, inventory and financial analytics with charts and exports.",
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    permission: "audit-logs",
    icon: History,
    group: "System",
    description: "Review a chronological trail of system and user activities.",
  },
  {
    label: "Notifications",
    path: "/notifications",
    permission: "notifications",
    icon: Bell,
    group: "System",
    description:
      "View alerts for low stock, overdue invoices and system events.",
  },
  {
    label: "Settings",
    path: "/settings",
    permission: "settings",
    icon: Settings,
    group: "System",
    description:
      "Configure store details, tax rates, invoice preferences and more.",
  },
];

// Role-based access control for protected areas.
export const ROLES = {
  ADMIN: "admin",
  CASHIER: "cashier",
};

// Permission names mirror the module routes (single source of truth).
export const PERMISSIONS = [
  "dashboard",
  "billing",
  "invoices",
  "products",
  "categories",
  "inventory",
  "customers",
  "suppliers",
  "purchases",
  "payments",
  "returns",
  "reports",
  "users",
  "audit-logs",
  "notifications",
  "settings",
];

// Maps each role to the permissions it may access.
// Used by AuthContext.hasPermission() and the route guards.
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [...PERMISSIONS],
  [ROLES.CASHIER]: [
    "dashboard",
    "billing",
    "invoices",
    "products",
    "customers",
    "payments",
    "notifications",
  ],
};

// Shared palette for dashboard and report charts (Recharts).
export const CHART_COLORS = [
  "#4f46e5", // brand-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

export const INVOICE_STATUSES = ["ACTIVE", "CANCELLED"];

export const INVOICE_STATUS_LABELS = {
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "credit",
  "bank_transfer",
  "upi",
];

// POS / Billing payment methods
export const POS_PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit" },
];

// Payment statuses (spec: PAID / PARTIAL / UNPAID / REFUNDED)
export const PAYMENT_STATUSES = ["PAID", "PARTIAL", "UNPAID", "REFUNDED"];

export const PAYMENT_STATUS_LABELS = {
  PAID: "Paid",
  PARTIAL: "Partially Paid",
  UNPAID: "Unpaid",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_COLORS = {
  PAID: "emerald",
  PARTIAL: "amber",
  UNPAID: "red",
  REFUNDED: "gray",
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit" },
];

export const INVENTORY_TRANSACTION_TYPES = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
];

export const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

export const STOCK_STATUS_LABELS = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export const TRANSACTION_TYPE_LABELS = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  RETURN: "Return",
  ADJUSTMENT_IN: "Stock Addition",
  ADJUSTMENT_OUT: "Stock Removal",
};

export const ADJUSTMENT_IN_REASONS = [
  "Found stock",
  "Counting error",
  "Returns from previous adjustment",
  "Other",
];

export const ADJUSTMENT_OUT_REASONS = [
  "Damaged goods",
  "Spoilage",
  "Theft",
  "Counting discrepancy",
  "Other",
];

export const STOCK_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "IN_STOCK", label: "In Stock" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

export const RETURN_STATUSES = ["pending", "approved", "completed", "rejected"];

export const PURCHASE_STATUSES = ["pending", "received", "cancelled"];

export const USER_STATUSES = ["active", "inactive"];

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
