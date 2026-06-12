import { apiGet, apiPatch } from '../api.mjs';

async function fetchNotifications() {
  try {
    return await apiGet('/api/notifications') ?? [];
  } catch {
    return [];
  }
}

export const fetchUnreadNotifications = fetchNotifications;
export const fetchAllNotifications = fetchNotifications;

export const markNotificationAsRead = id => apiPatch(`/api/notifications/${id}`, { isRead: true });
export const markAllNotificationsAsRead = () => apiPatch('/api/notifications', { isRead: true, applyToAll: true });
