# BillApp — Billing Management Application

A professional, production-style **Billing Management frontend** built with React, Vite and Tailwind CSS. The current mock backend is **JSON Server**; the architecture is designed so the backend can be swapped for a **Spring Boot REST API** with minimal frontend changes.

## Tech Stack

- **React 18** + **Vite** (JavaScript / ES6+, no TypeScript)
- **Tailwind CSS** (responsive, utility-first)
- **React Router v6** (protected routes)
- **Axios** (centralized API client)
- **Context API** (authentication + global UI state)
- **React Hook Form** (form state & validation)
- **Recharts** (charts)
- **Lucide React** (icons)
- **JSON Server** (mock REST API on port 3001)
- **jsPDF** (client-side invoice PDF generation — ready for the invoices module)

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### 1. Install dependencies

```bash
npm install
```

### 2. Start everything (mock API + frontend)

```bash
npm start
```

This launches BOTH servers in one terminal:

- **JSON Server** (mock API) → <http://localhost:3001>
- **Vite** (frontend) → <http://localhost:5173>

> Open <http://localhost:5173> in your browser. If the frontend was already
> open before the servers started, refresh the page.

### Alternative: two terminals

If you prefer to run them separately:

```bash
# Terminal 1 — mock API
npm run server

# Terminal 2 — frontend
npm run dev
```

JSON Server serves `db.json` at <http://localhost:3001>.
Resources available: `users`, `products`, `categories`, `customers`, `suppliers`, `purchases`, `purchaseItems`, `invoices`, `invoiceItems`, `payments`, `inventoryTransactions`, `returns`, `returnItems`, `notifications`, `auditLogs`, `settings`.

### Demo login

| Email                | Password   | Role    |
| -------------------- | ---------- | ------- |
| admin@billapp.com    | admin123   | admin   |
| rahul@billapp.com    | rahul123   | cashier |
| priya@billapp.com    | priya123   | cashier |
| sneha@billapp.com    | sneha123   | cashier (deactivated) |

> Authentication is simulated against the `users` collection in JSON Server and
> uses a JWT-shaped mock token (see `src/services/authService.js`).
> When Spring Boot + Spring Security are introduced, only `src/services/authService.js` changes.

## Project Structure

```
src/
├── assets/                 # Static assets
├── components/
│   ├── common/             # Reusable UI: Button, Input, Select, Modal,
│   │                       # ConfirmDialog, Table, Pagination, SearchBar,
│   │                       # DatePicker, StatusBadge, LoadingSpinner,
│   │                       # Skeleton, EmptyState, ErrorState, Toast, Card,
│   │                       # StatCard, Dropdown, Tabs, Breadcrumb, PageHeader,
│   │                       # ModuleIndexPage (standard list page)
│   ├── layout/             # Sidebar, Header
│   ├── charts/             # Recharts wrappers: ChartCard, SalesTrendChart,
│   │                       # CategorySalesChart, TopProductsChart,
│   │                       # PaymentMethodsChart
│   ├── dashboard/          # Dashboard tables: RecentInvoicesTable, LowStockTable
│   ├── forms/              # Form-specific components (future)
│   ├── tables/             # Table-specific components (future)
│   ├── modals/             # Modal-specific components (future)
│   └── cards/              # Card-specific components (future)
├── pages/                  # One folder per module (placeholder pages for now)
├── services/               # API layer — all Axios calls live here
│   ├── api.js              # Centralized Axios instance
│   ├── authService.js
│   ├── productService.js
│   ├── categoryService.js
│   ├── inventoryService.js
│   ├── customerService.js
│   ├── supplierService.js
│   ├── purchaseService.js
│   ├── invoiceService.js
│   ├── paymentService.js
│   ├── returnService.js
│   ├── reportService.js
│   ├── userService.js
│   ├── notificationService.js
│   ├── auditLogService.js
│   ├── settingsService.js
│   └── dashboardService.js
├── context/                # AuthContext, AppContext
├── hooks/                  # useDebounce, useClickOutside, useMediaQuery
├── utils/                  # calculations, formatters, validators, constants
├── routes/                 # AppRoutes, ProtectedRoute
├── layouts/                # AuthLayout, DashboardLayout
├── App.jsx
└── main.jsx
```

## Key Design Decisions

### API layer is isolated from UI

- UI components **never call Axios directly** (except inside services).
- Every resource has a service module (e.g. `productService.getProducts()`).
- The Axios base URL is set from `VITE_API_BASE_URL` (default `http://localhost:3001`).

To move to **Spring Boot** later, only the service modules (and the base URL) need to change, e.g.:

```diff
 // productService.js
-const RESOURCE = '/products';
+const RESOURCE = '/api/products';
```

### Business logic is isolated from UI

- Financial math lives in `src/utils/calculations.js` (subtotal, tax, discount, totals).
- Formatting lives in `src/utils/formatters.js` (currency, dates, numbers).
- Validation lives in `src/utils/validators.js` (used with React Hook Form).

### Reusable components

All shared UI lives in `src/components/common` and is exported from an index barrel. Pages should compose these building blocks instead of repeating markup.

### Routing

- `/login` — unauthenticated (AuthLayout).
- All other routes are protected by `ProtectedRoute` and render inside `DashboardLayout` (sidebar + header).
- Every module page shows a **breadcrumb trail** (`Home / Module`), a **page title** via `PageHeader`, and a
  consistent structure: **PageHeader → Filters / Actions → Main Content → Pagination**.
- The sidebar groups modules into sections (Overview, Sales, Catalog, Purchasing, People, Analytics, System)
  with active-route highlighting and an off-canvas drawer on mobile.
- Unknown URLs fall back to a 404 page.

### Standard module pages (ModuleIndexPage)

List-based modules (Products, Categories, Inventory, Customers, Suppliers, Purchases, Invoices, Payments,
Returns, Reports, Users, Audit Logs, Notifications) render through the shared `ModuleIndexPage` component.
It always:

- Fetches data through the module's service layer — pages never call Axios directly.
- Supports **loading** (skeletons), **empty** (with a search-aware message) and **error** (with retry) states.
- Provides search (debounced `q`), optional filters, server-side pagination via `_page`/`_limit`, and
  `_expand` for related-record columns on JSON Server.
- Reads the total row count from the `X-Total-Count` header (JSON Server) and falls back to the row length,
  so the Spring Boot backend can normalize its `{ data, headers }` response without UI changes.

### Dashboard

The dashboard is fully dynamic — no value is hardcoded. `dashboardService` fetches the raw collections once
per load (one shared short-TTL cache for all seven getters) and computes every KPI in the service layer,
because JSON Server has no aggregation endpoints:

- `getSummary()` — today's/total sales, today's bills, customers, products, low-stock count (threshold read
  from `settings.lowStockThreshold`), pending payments (outstanding balances of pending/overdue invoices,
  with only settled payments deducted) and total profit (unit price − product cost per line)
- `getSalesData()` — zero-filled daily / weekly / monthly revenue series (quiet periods stay visible)
- `getTopProducts()`, `getCategorySales()`, `getPaymentDistribution()`, `getRecentInvoices()`,
  `getLowStockProducts()`

Draft and cancelled invoices are excluded from all sales figures. The seed dates in `db.json` were generated
relative to a recent date so "today" metrics and trends show meaningful values — shift them if you want a
different demo window. When Spring Boot arrives, each function can call a dedicated dashboard endpoint
(e.g. `GET /api/dashboard/summary`) and keep returning the same shapes, so no UI changes are needed.

### Authentication & Authorization

- **Login** (`/login`) — email + password with validation, show/hide password toggle,
  **Remember me** (extends the session to 30 days instead of 8 hours), loading state,
  inline error messages, and a redirect back to the originally requested page
  (or the dashboard) after a successful sign-in.
- **AuthContext** exposes `currentUser`, `isAuthenticated`, `login()`, `logout()`,
  `hasRole(...roles)` and `hasPermission(permission)`. UI never touches the auth
  backend directly.
- **authService** is JWT-ready: `login()` issues a JWT-shaped mock token
  (`header.payload.signature` with `sub` / `role` / `iat` / `exp` claims), the
  session (token + user + expiry) is persisted in `localStorage`, and
  `getCurrentUser()` validates the token `exp` on restore. Moving to Spring Boot
  + Spring Security changes only this file (e.g. `login()` → `POST /auth/login`
  returning a real signed JWT; `logout()` gains a server-side revocation call).
- **Role-based access control** (permission names mirror module routes):

  | Permission area                                        | ADMIN | CASHIER |
  | ------------------------------------------------------ | :---: | :-----: |
  | Dashboard, Billing, Invoices, Products, Customers, Payments, Notifications | ✅ | ✅ |
  | Categories, Inventory, Suppliers, Purchases, Returns   |  ✅   |    —    |
  | Reports, Users, Settings, Audit Logs                   |  ✅   |    —    |

- **Protected routes** — every module route carries a `permission` and is wrapped
  in `ProtectedRoute`: unauthenticated users are redirected to `/login`, while
  authenticated users without permission see a **403 Access denied** page.
  The sidebar only shows the modules the current role may access.

## Commands

| Command                  | Description                          |
| ------------------------ | ------------------------------------ |
| `npm start`              | Start mock API **and** frontend together |
| `npm run dev`            | Start only the Vite dev server (5173)     |
| `npm run build`          | Production build                      |
| `npm run preview`        | Preview the production build          |
| `npm run server`         | Start JSON Server on http://localhost:3001 |
| `npm run server:watch`   | Start JSON Server with file watching (auto-reloads on db.json changes) |

## Roadmap

Module index pages and the dashboard are wired to the live JSON Server API. The following detailed
functionality will be implemented in upcoming iterations:

1. **Billing / POS** — product grid, cart, checkout, payment
2. **Invoices** — detail view, status workflow, PDF generation (jsPDF)
3. **Products / Categories / Inventory** — create/edit forms, stock adjustments, low-stock alerts
4. **Customers / Suppliers / Purchases** — create/edit forms
5. **Payments / Returns** — create/approve workflows
6. **Reports** — charts (Recharts) + CSV/PDF export
7. **Users / Audit Logs / Notifications / Settings** — CRUD and configuration forms