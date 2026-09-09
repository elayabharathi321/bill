import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { ROLE_PERMISSIONS } from '../utils/constants';

const AuthContext = createContext(null);

/**
 * Authentication + authorization context.
 *
 * UI components never talk to the auth backend directly — they call the
 * helpers exposed here. All storage / token details live in authService so
 * the implementation can be swapped for real JWT auth without UI changes.
 *
 * Provides:
 *   currentUser    — the logged-in user object (or null)
 *   isAuthenticated— boolean
 *   login(email, password, rememberMe)
 *   logout()
 *   hasRole(...roles)       — true if the current user has ANY of the roles
 *   hasPermission(permission) — true if the current role may access a module
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  // Re-hydrate the user from the persisted session on mount.
  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await authService.login(email, password, rememberMe);
      setCurrentUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const hasRole = (...roles) => {
    if (!currentUser || !currentUser.role) return false;
    const userRole = String(currentUser.role).toLowerCase();
    return roles.some((role) => String(role).toLowerCase() === userRole);
  };

  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.role) return false;
    const allowed = ROLE_PERMISSIONS[String(currentUser.role).toLowerCase()];
    return Array.isArray(allowed) && allowed.includes(permission);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      loading,
      login,
      logout,
      hasRole,
      hasPermission,
    }),
    [currentUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}