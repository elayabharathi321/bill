import api from './api';

// Report endpoints. JSON Server does not compute analytics, so reports
// are derived from raw collections. When Spring Boot is introduced these
// functions can call dedicated report endpoints without UI changes.

export function getSalesReport(params) {
  return api.get('/invoices', { params });
}

export function getInventoryReport(params) {
  return api.get('/products', { params });
}

export function getPaymentsReport(params) {
  return api.get('/payments', { params });
}

export function getCustomersReport(params) {
  return api.get('/customers', { params });
}

export function getPurchaseReport(params) {
  return api.get('/purchases', { params });
}