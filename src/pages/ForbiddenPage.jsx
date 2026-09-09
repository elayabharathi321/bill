import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Button from '../components/common/Button';

/**
 * 403 page shown when an authenticated user lacks the permission
 * required by the module they tried to open.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldX className="h-8 w-8" />
      </div>
      <p className="mt-4 text-5xl font-bold text-brand-600">403</p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        You don’t have permission to view this page. If you believe this is a
        mistake, contact an administrator.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}