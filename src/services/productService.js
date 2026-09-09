import api from './api';

// Product API. Endpoint paths are isolated here so switching to
// Spring Boot (e.g. GET /api/products) only requires changing this file.
const RESOURCE = '/products';

export function getProducts(params) {
  return api.get(RESOURCE, { params });
}

export function getProductById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createProduct(data) {
  return api.post(RESOURCE, data);
}

export function updateProduct(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteProduct(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

/**
 * Search products by keyword (name, SKU, barcode, brand).
 *
 * JSON Server answers `q` as a full-text filter, so this is equivalent to
 * `getProducts({ q: query })`. It is exposed as a dedicated method so the API
 * surface reads like a first-class search endpoint — when Spring Boot is
 * introduced, swap the body to `api.get('/api/products/search', { params: { q: query } })`
 * and every caller keeps working.
 * @param {string} query
 */
export function searchProducts(query) {
  return api.get(RESOURCE, { params: { q: query } });
}