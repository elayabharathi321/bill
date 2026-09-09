import { Loader2 } from 'lucide-react';

/**
 * Centered loading spinner.
 */
export default function LoadingSpinner({ label = 'Loading…', fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-gray-500
        ${fullPage ? 'min-h-[60vh]' : 'py-12'}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}