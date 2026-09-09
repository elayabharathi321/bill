import api from './api';

const RESOURCE = '/categories';

export function getCategories(params) {
  return api.get(RESOURCE, { params });
}

export function getCategoryById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createCategory(data) {
  return api.post(RESOURCE, data);
}

export function updateCategory(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteCategory(id) {
  return api.delete(`${RESOURCE}/${id}`);
}