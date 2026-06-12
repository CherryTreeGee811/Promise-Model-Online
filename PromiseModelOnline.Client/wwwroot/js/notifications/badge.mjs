import { fetchUnreadNotifications } from './api.mjs';
<<<<<<< HEAD
import { startSignalR, stopSignalR } from './signalr.mjs';

const NOTIFICATIONS_EVENT = 'pmo:notifications:unread-updated';
let started = false;

function setBadgeCount(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    const safeCount = Number.isFinite(count) ? count : 0;
    if (safeCount > 0) {
        badge.textContent = String(safeCount);
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

async function handleNotificationUpdate() {
    try {
        const notifications = await fetchUnreadNotifications();
        const count = Array.isArray(notifications) ? notifications.length : 0;
        setBadgeCount(count);

        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, {
            detail: { notifications: Array.isArray(notifications) ? notifications : [] }
        }));
    } catch {
        setBadgeCount(0);
    }
}

export async function updateNotificationBadge() {
    await handleNotificationUpdate();
}

export function stopNotificationPolling() {
    started = false;
    stopSignalR();
}

export function startNotificationPolling() {
    handleNotificationUpdate();

    if (started) return;
    started = true;

    startSignalR(() => {
        handleNotificationUpdate();
    });
}

export function getUnreadNotificationsEventName() {
    return NOTIFICATIONS_EVENT;
}
||||||| 1bedf4f
=======
import { startNotificationPolling as startUnreadPolling } from './poller.mjs';

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
export function startNotificationPolling() {
    if (started) return;
    started = true;

    // Immediate badge update; then background polling.
    updateNotificationBadge();
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
