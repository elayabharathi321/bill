import api from './api';

const RESOURCE = '/purchases';
const ITEMS_RESOURCE = '/purchaseItems';

export function getPurchases(params) {
  return api.get(RESOURCE, { params });
}

export function getPurchaseById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createPurchase(data) {
  return api.post(RESOURCE, data);
}

export function updatePurchase(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deletePurchase(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

export function getPurchaseItems(params) {
  return api.get(ITEMS_RESOURCE, { params });
}

export function createPurchaseItem(data) {
  return api.post(ITEMS_RESOURCE, data);
}

export function deletePurchaseItem(id) {
  return api.delete(`${ITEMS_RESOURCE}/${id}`);
}