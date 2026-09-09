import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Select from './Select';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';

/**
 * Pagination controls. Works with the total item count and an onChange callback.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors';

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages <= 7 || Math.abs(i - page) <= 1 || i === 1 || i === totalPages) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}</span>–
        <span className="font-medium text-gray-700">{end}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows:</span>
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={pageSizeOptions.map((size) => ({ value: size, label: size }))}
            className="!w-20 !py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`${pageButtonClass} ${page === 1 ? 'cursor-not-allowed text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => onChange(1)}
            disabled={page === 1}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            className={`${pageButtonClass} ${page === 1 ? 'cursor-not-allowed text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`${pageButtonClass} ${
                  p === page
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className={`${pageButtonClass} ${page === totalPages ? 'cursor-not-allowed text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            className={`${pageButtonClass} ${page === totalPages ? 'cursor-not-allowed text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => onChange(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}