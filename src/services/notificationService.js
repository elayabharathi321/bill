import api from './api';

const RESOURCE = '/notifications';

export function getNotifications(params) {
  return api.get(RESOURCE, { params });
}

export function getNotificationById(id) {
  return api.get(`${RESOURCE}/${id}`);
}

export function createNotification(data) {
  return api.post(RESOURCE, data);
}

export function updateNotification(id, data) {
  return api.put(`${RESOURCE}/${id}`, data);
}

export function deleteNotification(id) {
  return api.delete(`${RESOURCE}/${id}`);
}

export async function markAllAsRead() {
  const { data } = await api.get(RESOURCE);
  const unread = Array.isArray(data) ? data.filter((n) => !n.isRead) : [];
  await Promise.all(
    unread.map((n) => api.put(`${RESOURCE}/${n.id}`, { ...n, isRead: true }))
  );
  return unread.length;
}