import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Breadcrumb from '../components/common/Breadcrumb';
import { NAV_ITEMS } from '../utils/constants';
import { useApp } from '../context/AppContext';

/**
 * Authenticated dashboard layout: sidebar + header + scrollable content area.
 * A breadcrumb trail (Home / Module) is rendered at the top of the content
 * area for every module page.
 */
export default function DashboardLayout() {
  const { sidebarCollapsed } = useApp();
  const location = useLocation();

  const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
  const breadcrumbItems = [
    { label: 'Home', path: '/dashboard' },
    ...(match && match.path !== '/dashboard' ? [{ label: match.label }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`flex min-h-screen flex-col lg:transition-all lg:duration-200 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {match && (
              <div className="mb-4">
                <Breadcrumb items={breadcrumbItems} />
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}