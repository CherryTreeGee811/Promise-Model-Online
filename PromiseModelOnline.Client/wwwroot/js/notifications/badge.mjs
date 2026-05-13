import { fetchUnreadNotifications } from './api.mjs';

/**
 * Updates the notification badge count.
 */
export async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const notifications = await fetchUnreadNotifications();
        const count = Array.isArray(notifications) ? notifications.length : 0;

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        badge.style.display = 'none';
    }
}

/**
 * Starts polling for notification counts every 30 seconds.
 */
export function startNotificationPolling() {
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 30_000);
}