import { fetchUnreadNotifications } from './api.mjs';
import { startNotificationPolling as startUnreadPolling, stopNotificationPolling as stopUnreadPolling } from './poller.mjs';

const NOTIFICATIONS_EVENT = 'pmo:notifications:unread-updated';
let started = false;

function setBadgeCount(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    const safeCount = Number.isFinite(count) ? count : 0;
    if (safeCount > 0) {
        badge.textContent = String(safeCount);
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Fetches unread notifications and updates the badge (notification endpoints only).
 */
export async function updateNotificationBadge() {
    try {
        const notifications = await fetchUnreadNotifications();
        setBadgeCount(Array.isArray(notifications) ? notifications.length : 0);
    } catch {
        setBadgeCount(0);
    }
}

/**
 * Starts background polling for unread notifications.
 * Updates only the badge and (if present) the notifications list.
 */
export function stopNotificationPolling() {
    started = false;
    stopUnreadPolling();
}

export function startNotificationPolling() {
    // Always refresh badge immediately on each call (nav may have been replaced).
    updateNotificationBadge();

    // Only start background polling once.
    if (started) return;
    started = true;

    startUnreadPolling((notifications) => {
        setBadgeCount(Array.isArray(notifications) ? notifications.length : 0);

        // Let the notifications page update itself without navigation/reload.
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, {
            detail: { notifications: Array.isArray(notifications) ? notifications : [] }
        }));
    });
}

export function getUnreadNotificationsEventName() {
    return NOTIFICATIONS_EVENT;
}