import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

/**
 * Fetch unread notifications for the current user.
 * @returns {Promise<Array>} list of NotificationDTOs
 */
export async function fetchUnreadNotifications() {
    const token = getAccessTokenFromCookie();
    if (!token) return [];

    const res = await fetch(`${base}/api/notifications`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!res.ok) return [];
    return res.json();
}