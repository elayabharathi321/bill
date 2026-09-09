import api from './api';

// Audit log API. Endpoint paths are isolated here so switching to
// Spring Boot (e.g. GET /api/audit-logs) only requires changing this file.
const RESOURCE = '/auditLogs';

export function getAuditLogs(params) {
  return api.get(RESOURCE, { params });
}

export function getAuditLogById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createAuditLog(data) {
  return api.post(RESOURCE, data);
}

export function deleteAuditLog(id) {
  return api.delete(`${RESOURCE}/${id}`);
}