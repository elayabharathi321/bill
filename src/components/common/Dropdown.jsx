import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '../../hooks';

/**
 * Generic dropdown with a trigger and a menu of items.
 */
export default function Dropdown({
  trigger,
  items = [],
  align = 'left',
  width = 'w-56',
}) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const ref = useClickOutside(close);

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  const toggle = () => setOpen((prev) => !prev);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={toggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
      >
        {trigger}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
      {open && (
        <div
          className={`absolute z-40 mt-2 rounded-md border border-gray-200 bg-white shadow-lg ${alignClass} ${width}`}
        >
          {items.map((item, i) => {
            if (item === 'divider') {
              return <div key={`divider-${i}`} className="my-1 border-t border-gray-100" />;
            }
            const disabled = item.disabled;
            const danger = item.danger;
            return (
              <button
                key={item.key || item.label}
                onClick={() => {
                  close();
                  item.onClick?.();
                }}
                disabled={disabled}
                className={`block w-full px-4 py-2 text-left text-sm
                  ${danger ? 'text-red-600' : 'text-gray-700'}
                  hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}