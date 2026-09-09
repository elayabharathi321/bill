import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks';
import { formatDateTime, getInitials } from '../../utils/formatters';
import { getNotifications } from '../../services/notificationService';

function getPageTitle(pathname) {
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.path));
  return match ? match.label : 'Dashboard';
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications({ _sort: 'createdAt', _order: 'desc', _limit: 6 })
      .then(({ data }) => setNotifications(data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <p className="border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            Notifications
          </p>
          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-400">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400">No notifications</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-2.5 text-sm">
                  <p className={`font-medium ${n.isRead ? 'text-gray-500' : 'text-gray-800'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-gray-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {getInitials(currentUser.name)}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-gray-700 sm:block">
          {currentUser.name}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
            <p className="truncate text-xs text-gray-500">{currentUser.email}</p>
            <p className="mt-1 text-xs capitalize text-gray-400">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Application header: navigation toggle, page title, search,
 * notifications and user profile menu.
 */
export default function Header() {
  const { openMobileDrawer } = useApp();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Mobile nav toggle */}
      <button
        onClick={openMobileDrawer}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>

      <div className="flex flex-1 items-center gap-3">
        {/* Global search */}
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            className="input-base !pl-9"
            aria-label="Global search"
          />
        </div>
      </div>

      <NotificationsMenu />
      <ProfileMenu />
    </header>
  );
}