import { fetchUnreadNotifications } from './api.mjs';
import { startNotificationHub } from './signalr.mjs';

const NOTIFICATIONS_EVENT = 'pmo:notifications:unread-updated';
let started = false;

/*
====================================
BADGE UI
====================================
*/

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

/*
====================================
INITIAL LOAD
====================================
*/

export async function updateNotificationBadge() {
    try {
        const notifications = await fetchUnreadNotifications();
        setBadgeCount(Array.isArray(notifications) ? notifications.length : 0);
    } catch {
        setBadgeCount(0);
    }
}

/*
====================================
START REAL-TIME UPDATES
====================================
*/

export function startNotificationPolling() {
    if (started) return;
    started = true;

    // ✅ Initial load (fallback + first render)
    updateNotificationBadge();

    // ✅ Listen for real-time updates
    window.addEventListener(NOTIFICATIONS_EVENT, (e) => {
        const notifications = e?.detail?.notifications;

        setBadgeCount(
            Array.isArray(notifications) ? notifications.length : 0
        );
    });

    // ✅ Start SignalR connection
    startNotificationHub();
}

/*
====================================
EVENT NAME EXPORT
====================================
*/

export function getUnreadNotificationsEventName() {
    return NOTIFICATIONS_EVENT;
}