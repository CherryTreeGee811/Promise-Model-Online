import { apiGet, apiPatch } from '../api.ts';

/**
 * Fetch all notifications from the API.
 * @returns {Promise<object[]>} Array of notification objects.
 */
async function fetchNotifications() {
  try {
    return await apiGet('/api/notifications') ?? [];
  } catch {
    return [];
  }
}

/** Alias for fetchNotifications; retrieves unread notifications. \@type {typeof fetchNotifications} */
export const fetchUnreadNotifications = fetchNotifications;
/** Alias for fetchNotifications; retrieves all notifications. \@type {typeof fetchNotifications} */
export const fetchAllNotifications = fetchNotifications;

/**
 * Mark a single notification as read.
 * @param {number} id - The notification ID.
 * @returns {Promise<object>} The API response.
 */
export const markNotificationAsRead = id => apiPatch(`/api/notifications/${id}`, { isRead: true });
/**
 * Mark all notifications as read.
 * @returns {Promise<object>} The API response.
 */
export const markAllNotificationsAsRead = () => apiPatch('/api/notifications', { isRead: true, applyToAll: true });
