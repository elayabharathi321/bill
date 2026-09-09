import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Navigational breadcrumb trail.
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
            {isLast || !item.path ? (
              <span className="font-medium text-gray-700">{item.label}</span>
            ) : (
              <Link to={item.path} className="hover:text-brand-600">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}