import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export async function fetchUnreadNotifications() {
    const token = getAccessTokenFromCookie();
    if (!token) return [];
    const res = await fetch(`${base}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    return res.json();
}

export async function fetchAllNotifications() {
    const token = getAccessTokenFromCookie();
    if (!token) return [];
    const res = await fetch(`${base}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    return res.json();
}

export async function markNotificationAsRead(id) {
    const token = getAccessTokenFromCookie();
    await fetch(`${base}/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
    });
}

export async function markAllNotificationsAsRead() {
    const token = getAccessTokenFromCookie();
    await fetch(`${base}/api/notifications`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true, applyToAll: true })
    });
}