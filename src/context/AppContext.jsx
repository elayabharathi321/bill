import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

/**
 * Global UI state shared across the application:
 * - sidebar collapsed / expanded
 * - mobile navigation drawer open state
 */
export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const openMobileDrawer = () => setMobileDrawerOpen(true);
  const closeMobileDrawer = () => setMobileDrawerOpen(false);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      mobileDrawerOpen,
      openMobileDrawer,
      closeMobileDrawer,
    }),
    [sidebarCollapsed, mobileDrawerOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}