// Formatting helpers used across the UI.

const DEFAULT_CURRENCY = 'USD';

/**
 * Normalize a currency value to a valid ISO 4217 code.
 * Returns the default currency when the supplied value is not a
 * three-letter alphabetic code (e.g. a tick index leaked in by a caller).
 * @param {string} currency
 */
function normalizeCurrency(currency) {
  return /^[A-Z]{3}$/.test(currency) ? currency : DEFAULT_CURRENCY;
}

/**
 * Format a number as a currency string.
 * @param {number} value
 * @param {string} currency
 */
export function formatCurrency(value, currency = DEFAULT_CURRENCY) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizeCurrency(currency),
  }).format(numeric);
}

/**
 * Format a number with thousands separators.
 * @param {number} value
 */
export function formatNumber(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US').format(numeric);
}

/**
 * Format a number as a compact currency string (e.g. $1.2K).
 * Used for chart axes where full currency strings would overflow.
 * @param {number} value
 * @param {string} currency
 */
export function formatCompactCurrency(value, currency = DEFAULT_CURRENCY) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizeCurrency(currency),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numeric);
}

/**
 * Format an ISO date string to a readable local date.
 * @param {string|number|Date} value
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string to a readable date + time.
 * @param {string|number|Date} value
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Capitalize the first letter of a string.
 * @param {string} value
 */
export function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Truncate a string to a maximum length with an ellipsis.
 * @param {string} value
 * @param {number} maxLength
 */
export function truncate(value, maxLength = 50) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

/**
 * Build initials from a person's name.
 * @param {string} name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}