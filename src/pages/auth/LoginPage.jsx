import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { validators } from '../../utils/validators';
import { APP_NAME } from '../../utils/constants';

/**
 * Login page. Calls authService through AuthContext so the mock
 * authentication can later be swapped for a real Spring Boot JWT endpoint.
 */
export default function LoginPage() {
  const { currentUser, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: 'admin@billapp.com', password: 'admin123' },
  });

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect back to the page the user originally tried to open, or to the
  // dashboard when they arrived at /login directly.
  const resolveRedirect = () => {
    const from = location.state?.from;
    return from && from !== '/login' ? from : '/dashboard';
  };

  const onSubmit = async (data) => {
    setFormError('');
    try {
      await login(data.email, data.password, rememberMe);
      navigate(resolveRedirect(), { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-500">
        Sign in to {APP_NAME} to continue.
      </p>

      {formError && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input-base !pl-9 ${errors.email ? '!border-red-500' : ''}`}
              {...register('email', { validate: validators.required('Email is required') })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input-base !pl-9 !pr-10 ${errors.password ? '!border-red-500' : ''}`}
              {...register('password', { validate: validators.required('Password is required') })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="rememberMe" className="cursor-pointer text-sm text-gray-600">
            Remember me
          </label>
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-md bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <p className="font-medium text-gray-600">Demo credentials</p>
        <p>admin@billapp.com / admin123 — admin</p>
        <p>priya@billapp.com / priya123 — cashier</p>
      </div>
    </div>
  );
}