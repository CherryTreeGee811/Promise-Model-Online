<<<<<<< HEAD
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
||||||| 1bedf4f
=======
import { authFetch, base } from '../api.mjs';

/*
====================================
FETCH NOTIFICATIONS
====================================
*/

export async function fetchUnreadNotifications() {
    const res = await authFetch(`${base}/api/notifications`);

    if (!res.ok) return [];

    return res.json();
}

export async function fetchAllNotifications() {
    const res = await authFetch(`${base}/api/notifications`);

    if (!res.ok) return [];

    return res.json();
}

/*
====================================
MARK READ
====================================
*/

export async function markNotificationAsRead(id) {
    const res = await authFetch(`${base}/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function markAllNotificationsAsRead() {
    const res = await authFetch(`${base}/api/notifications`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true, applyToAll: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
