import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, NAV_GROUPS, APP_NAME } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

function SidebarLogo({ collapsed }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
        <span className="text-base font-bold">B</span>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{APP_NAME}</p>
          <p className="text-xs text-gray-400">Billing Suite</p>
        </div>
      )}
    </div>
  );
}

function UserSummary({ collapsed }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return (
    <div
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {getInitials(currentUser.name)}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-700">{currentUser.name}</p>
          <p className="truncate text-xs capitalize text-gray-400">{currentUser.role}</p>
        </div>
      )}
    </div>
  );
}

function NavLinkItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-brand-600 opacity-0 group-hover:opacity-60"
          aria-hidden="true"
        />
      )}
    </NavLink>
  );
}

/**
 * Application sidebar. In desktop mode it can expand/collapse; on mobile it
 * renders as an off-canvas drawer controlled by AppContext.
 */
export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileDrawerOpen, closeMobileDrawer } =
    useApp();
  const { hasPermission } = useAuth();

  // Role-based navigation: only render modules the current user may access.
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  // Group navigation items by their section so the sidebar renders
  // professional section labels (hidden while collapsed).
  const renderNavItems = ({ collapsed, onNavigate }) =>
    NAV_GROUPS
      .map((group) => ({
        group,
        items: visibleNavItems.filter((item) => (item.group || 'General') === group),
      }))
      .filter((section) => section.items.length > 0)
      .map(({ group, items }) => (
        <div key={group}>
          {!collapsed && (
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group}
            </p>
          )}
          {items.map((item) => (
            <NavLinkItem
              key={item.path}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ));

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={closeMobileDrawer}
        />
      )}

      {/* Drawer (mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white
          transition-transform duration-200 lg:hidden ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <SidebarLogo collapsed={false} />
          <button
            onClick={closeMobileDrawer}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {renderNavItems({ collapsed: false, onNavigate: closeMobileDrawer })}
        </nav>
        <div className="border-t border-gray-100 p-2">
          <UserSummary collapsed={false} />
        </div>
      </aside>

      {/* Static sidebar (tablet / desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-gray-200 bg-white
          transition-all duration-200 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } hidden lg:flex`}
      >
        <div className="flex items-center justify-between px-4">
          <SidebarLogo collapsed={sidebarCollapsed} />
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
          {renderNavItems({ collapsed: sidebarCollapsed })}
        </nav>
        <div className="border-t border-gray-100 p-2">
          <UserSummary collapsed={sidebarCollapsed} />
        </div>
      </aside>
    </>
  );
}