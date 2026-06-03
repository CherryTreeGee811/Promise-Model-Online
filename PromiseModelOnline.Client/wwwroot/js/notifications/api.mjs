import { authFetch } from '../api.mjs';

/*
====================================
FETCH NOTIFICATIONS
====================================
*/

export async function fetchUnreadNotifications() {
    const res = await authFetch(`/api/notifications`);

    if (!res.ok) return [];

    return res.json();
}

export async function fetchAllNotifications() {
    const res = await authFetch(`/api/notifications`);

    if (!res.ok) return [];

    return res.json();
}

/*
====================================
MARK READ
====================================
*/

export async function markNotificationAsRead(id) {
    const res = await authFetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function markAllNotificationsAsRead() {
    const res = await authFetch(`/api/notifications`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true, applyToAll: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}