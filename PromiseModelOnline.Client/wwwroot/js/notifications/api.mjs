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
    await fetch(`${base}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function markAllNotificationsAsRead() {
    const token = getAccessTokenFromCookie();
    await fetch(`${base}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}