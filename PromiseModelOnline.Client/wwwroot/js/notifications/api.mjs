import { get, patch } from '../api.mjs';

/*
====================================
FETCH NOTIFICATIONS
====================================
*/

// ✅ Unified fetch (with optional filter later if API supports it)
export function fetchNotifications() {
    return get(`/notifications`);
}

// ✅ Alias for clarity (optional future filtering)
export const fetchUnreadNotifications = fetchNotifications;

/*
====================================
MARK READ
====================================
*/

export function markNotificationAsRead(id) {
    return patch(`/notifications/${id}`, {
        isRead: true
    });
}

export function markAllNotificationsAsRead() {
    return patch(`/notifications`, {
        isRead: true,
        applyToAll: true
    });
}