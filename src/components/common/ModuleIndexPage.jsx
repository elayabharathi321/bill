import { useEffect, useMemo, useState } from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Table from './Table';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import Select from './Select';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Skeleton from './Skeleton';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { useDebounce } from '../../hooks';

/**
 * Standard list page used by index-style modules.
 *
 * Enforces the consistent page structure used across the application:
 *
 *   PageHeader → Filters / Actions → Main Content → Pagination
 *
 * Data is ALWAYS fetched through the service layer (never Axios directly),
 * so swapping JSON Server for Spring Boot stays a service-layer concern.
 *
 * Every page supports three states out of the box:
 *   - Loading : skeleton rows
 *   - Error   : ErrorState with a retry action
 *   - Empty   : EmptyState (search-aware message when a query is active)
 *
 * NOTE: `getData`, `columns` and `baseParams` must be stable references
 * (module-level constants). The page refetches on pagination and query
 * changes, so passing object literals would re-trigger the loading state.
 *
 * @param {string} title Page title (rendered by PageHeader unless hidden).
 * @param {string} description Subtitle shown under the title.
 * @param {(params: object) => Promise<{data: Array, headers: object}>} getData
 *   Service-layer getter. Must accept a params object and return a promise
 *   resolving with `{ data, headers }` (the raw Axios response works because
 *   it exposes exactly these two keys).
 * @param {Array<{key: string, header: string, render?: (row) => Node, align?: string}>} columns
 * @param {Array<{key: string, label: string, placeholder?: string, options: Array}>} filters
 * @param {Array<{label: string, value: string, order?: string}>} sortOptions
 *   When provided, renders a "Sort by" control. Each option sets `_sort` /
 *   `_order` for the request. Omitting it keeps the original behaviour of
 *   falling back to `defaultSort` / `defaultOrder`.
 * @param {object} baseParams Extra query params merged into every request
 *   (e.g. JSON Server `_expand` for related resources).
 * @param {ReactNode} actions Page-level controls (e.g. an "Add" button)
 *   rendered in the header alongside the title.
 * @param {(row: any) => ReactNode} rowActions
 *   Optional renderer for a per-row actions column (e.g. edit / delete).
 * @param {string} actionHeader Header label for the row-actions column.
 * @param {number} refreshKey
 *   Bump (any primitive) from a parent to force a refetch, e.g. after a
 *   create / update / delete succeeds.
 */
export default function ModuleIndexPage({
  title,
  description,
  getData,
  columns = [],
  searchPlaceholder = 'Search…',
  filters = [],
  sortOptions,
  defaultSort = 'id',
  defaultOrder = 'asc',
  baseParams = {},
  emptyTitle = 'No records found',
  emptyDescription,
  hideHeader = false,
  actions,
  rowActions,
  actionHeader = '',
  refreshKey = 0,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortOrder, setSortOrder] = useState(defaultOrder);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  // Jump back to the first page whenever the query (search / filters) changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterValues]);

  // When sortOptions are provided, the initial selection mirrors the default
  // sort so behaviour is stable before the user touches the control.
  useEffect(() => {
    if (sortOptions) {
      setSortBy(defaultSort);
      setSortOrder(defaultOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOptions]);

  // Build a single, stable sort-options list for the Select.
  const sortSelectOptions = useMemo(
    () =>
      (sortOptions || []).map((option) => ({
        value: `${option.value}:${option.order || 'asc'}`,
        label: option.label,
      })),
    [sortOptions]
  );

  useEffect(() => {
    const params = {
      _page: page,
      _limit: pageSize,
      _sort: sortBy,
      _order: sortOrder,
      ...baseParams,
    };

    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim();
    }
    for (const [key, value] of Object.entries(filterValues)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    }

    setLoading(true);
    setError(null);

    getData(params)
      .then(({ data, headers }) => {
        const rows = Array.isArray(data) ? data : [];
        setItems(rows);
        // JSON Server exposes the total row count as `X-Total-Count`.
        // Fall back to the row length so other backends work too.
        const countHeader = headers ? headers['x-total-count'] : undefined;
        setTotal(countHeader !== undefined ? Number(countHeader) : rows.length);
      })
      .catch((err) => {
        setItems([]);
        setTotal(0);
        setError(
          err && err.message
            ? err.message
            : 'Something went wrong. Please try again.'
        );
      })
      .finally(() => setLoading(false));
  }, [
    page,
    pageSize,
    debouncedSearch,
    filterValues,
    sortBy,
    sortOrder,
    refreshKey,
    reloadKey,
    getData,
    baseParams,
  ]);

  const hasQuery = Boolean(debouncedSearch.trim());
  const isFiltered =
    hasQuery || Object.values(filterValues).some((value) => value !== '');

  return (
    <div className="space-y-6">
      {!hideHeader && <PageHeader title={title} subtitle={description} actions={actions} />}

      <Card>
        {/* Filters / Actions */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/40 px-4 py-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72"
          />
          {sortSelectOptions.length > 0 ? (
            <div className="w-48">
              <Select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = String(e.target.value).split(':');
                  setSortBy(field || sortBy);
                  setSortOrder(order || sortOrder);
                }}
                placeholder="Sort by"
                options={sortSelectOptions}
                aria-label="Sort by"
              />
            </div>
          ) : null}
          {filters.map((filter) => (
            <div key={filter.key} className={filter.className || 'w-44'}>
              <Select
                value={filterValues[filter.key] || ''}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    [filter.key]: e.target.value,
                  }))
                }
                placeholder={filter.placeholder || `All ${filter.label}s`}
                options={filter.options}
                aria-label={filter.label}
              />
            </div>
          ))}
        </div>

        {/* Main content with loading / error / empty states */}
        {loading ? (
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-11" count={6} />
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={isFiltered ? 'No matches' : emptyTitle}
            description={
              isFiltered
                ? `Nothing matches your ${
                    hasQuery ? `search for “${debouncedSearch}”` : 'current filters'
                  }. Try adjusting the search or filters.`
                : emptyDescription
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              actions={rowActions}
              actionHeader={actionHeader}
            />
            {/* Pagination */}
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onPageSizeChange={(size) => {
                setPage(1);
                setPageSize(size);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
