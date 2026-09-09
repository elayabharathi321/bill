import api from './api';

const RESOURCE = '/users';

export function getUsers(params) {
  return api.get(RESOURCE, { params });
}

export function getUserById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createUser(data) {
  return api.post(RESOURCE, data);
}

export function updateUser(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteUser(id) {
  return api.delete(`${RESOURCE}/${id}`);
}