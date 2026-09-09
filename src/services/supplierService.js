import api from './api';

const RESOURCE = '/suppliers';

export function getSuppliers(params) {
  return api.get(RESOURCE, { params });
}

export function getSupplierById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createSupplier(data) {
  return api.post(RESOURCE, data);
}

export function updateSupplier(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteSupplier(id) {
  return api.delete(`${RESOURCE}/${id}`);
}