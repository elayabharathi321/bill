import { forwardRef } from 'react';

/**
 * Date input field. Uses a native date picker styled consistently.
 */
const DatePicker = forwardRef(function DatePicker(
  { label, error, className = '', id, min, max, ...props },
  ref
) {
  const pickerId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={pickerId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={pickerId}
        type="date"
        min={min}
        max={max}
        className={`input-base ${error ? 'border-red-500 focus:ring-red-500/30' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default DatePicker;