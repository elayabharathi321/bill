import api from './api';

const RESOURCE = '/returns';
const ITEMS_RESOURCE = '/returnItems';

export function getReturns(params) {
  return api.get(RESOURCE, { params });
}

export function getReturnById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createReturn(data) {
  return api.post(RESOURCE, data);
}

export function updateReturn(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteReturn(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

export function getReturnItems(params) {
  return api.get(ITEMS_RESOURCE, { params });
}

export function createReturnItem(data) {
  return api.post(ITEMS_RESOURCE, data);
}

export function deleteReturnItem(id) {
  return api.delete(`${ITEMS_RESOURCE}/${id}`);
}