import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import NotFoundPage from '../pages/NotFoundPage';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Modules (placeholder pages for now)
import BillingPage from '../pages/billing/BillingPage';
import InvoicesPage from '../pages/invoices/InvoicesPage';
import ProductsPage from '../pages/products/ProductsPage';
import CategoriesPage from '../pages/categories/CategoriesPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import CustomersPage from '../pages/customers/CustomersPage';
import SuppliersPage from '../pages/suppliers/SuppliersPage';
import PurchasesPage from '../pages/purchases/PurchasesPage';
import PaymentsPage from '../pages/payments/PaymentsPage';
import ReturnsPage from '../pages/returns/ReturnsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import UsersPage from '../pages/users/UsersPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AuditLogsPage from '../pages/audit-logs/AuditLogsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';

const protectedRoutes = [
  { path: 'dashboard', element: <DashboardPage />, permission: 'dashboard' },
  { path: 'billing', element: <BillingPage />, permission: 'billing' },
  { path: 'invoices', element: <InvoicesPage />, permission: 'invoices' },
  { path: 'products', element: <ProductsPage />, permission: 'products' },
  { path: 'categories', element: <CategoriesPage />, permission: 'categories' },
  { path: 'inventory', element: <InventoryPage />, permission: 'inventory' },
  { path: 'customers', element: <CustomersPage />, permission: 'customers' },
  { path: 'suppliers', element: <SuppliersPage />, permission: 'suppliers' },
  { path: 'purchases', element: <PurchasesPage />, permission: 'purchases' },
  { path: 'payments', element: <PaymentsPage />, permission: 'payments' },
  { path: 'returns', element: <ReturnsPage />, permission: 'returns' },
  { path: 'reports', element: <ReportsPage />, permission: 'reports' },
  { path: 'users', element: <UsersPage />, permission: 'users' },
  { path: 'audit-logs', element: <AuditLogsPage />, permission: 'audit-logs' },
  { path: 'notifications', element: <NotificationsPage />, permission: 'notifications' },
  { path: 'settings', element: <SettingsPage />, permission: 'settings' },
];

/**
 * Application route tree. Every authenticated route is wrapped in
 * ProtectedRoute — unauthenticated users are redirected to /login and
 * users without the module permission see a 403 page.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect root to the dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        {protectedRoutes.map(({ path, element, permission }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute permission={permission}>{element}</ProtectedRoute>}
          />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}