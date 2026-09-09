import { Outlet } from 'react-router-dom';
import { APP_NAME } from '../utils/constants';

/**
 * Layout for unauthenticated pages (login).
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-xl font-bold text-white">
            {APP_NAME[0]}
          </div>
        </div>
        <div className="card p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          {APP_NAME} — Professional Billing Management
        </p>
      </div>
    </div>
  );
}