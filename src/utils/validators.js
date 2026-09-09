// Validation helpers used with React Hook Form and plain inputs.

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value) {
  return /^[+()\-\s\d]{7,20}$/.test(value);
}

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function isPositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

export function isNonNegativeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
}

export function minLength(value, length) {
  return String(value || '').length >= length;
}

export function maxLength(value, length) {
  return String(value || '').length <= length;
}

// Common React Hook Form validators.
export const validators = {
  required: (message = 'This field is required') => (value) =>
    isRequired(value) || message,
  email: (message = 'Enter a valid email address') => (value) =>
    !value || isEmail(value) || message,
  phone: (message = 'Enter a valid phone number') => (value) =>
    !value || isPhone(value) || message,
  positive: (message = 'Must be greater than zero') => (value) =>
    !value || isPositiveNumber(value) || message,
  nonNegative: (message = 'Must be zero or greater') => (value) =>
    !value || isNonNegativeNumber(value) || message,
  minLength: (length, message = `Must be at least ${length} characters`) => (value) =>
    !value || minLength(value, length) || message,
};