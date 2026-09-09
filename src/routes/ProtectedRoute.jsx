import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ForbiddenPage from '../pages/ForbiddenPage';

/**
 * Guards protected routes.
 *
 * - Unauthenticated users are redirected to /login (remembering where they
 *   were headed so they are sent back after a successful login).
 * - Authenticated users who lack the required permission (role-based access
 *   control) see a 403 "Access denied" page instead of the module.
 *
 * Pass `permission` to enable the role check, e.g.:
 *   <ProtectedRoute permission="users"><UsersPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (permission && !hasPermission(permission)) {
    return <ForbiddenPage />;
  }
  return children;
}