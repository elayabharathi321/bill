import { forwardRef } from 'react';

/**
 * Reusable textarea. Supports React Hook Form registration via ref.
 */
const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 3, className = '', id, ...props },
  ref
) {
  const textareaId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`input-base ${error ? 'border-red-500 focus:ring-red-500/30' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Textarea;