import api from './api';

// Settings API. `settings` is a single configuration object resource
// in JSON Server, so reads use GET /settings and updates use PUT /settings.
// Endpoint paths are isolated here for the future Spring Boot swap.
const RESOURCE = '/settings';

export function getSettings() {
  return api.get(RESOURCE);
}

export function getSettingById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function updateSettings(data) {
  return api.put(RESOURCE, data);
}