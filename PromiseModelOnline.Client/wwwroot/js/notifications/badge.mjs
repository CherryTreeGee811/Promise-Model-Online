import { fetchUnreadNotifications } from './api.mjs';
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
