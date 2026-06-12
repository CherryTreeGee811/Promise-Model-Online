import { fetchUnreadNotifications } from "./api.mjs";

let intervalId = null;
let lastSignature = null;

function signature(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) return "";
    // Stable signature for change detection (order-insensitive).
    return notifications
        .map(n => n?.id)
        .filter(id => typeof id === 'number')
        .sort((a, b) => a - b)
        .join(',');
}

async function pollOnce(onChange) {
    try {
        const notifications = await fetchUnreadNotifications();
        const sig = signature(notifications);

        if (sig !== lastSignature) {
            lastSignature = sig;
            onChange(Array.isArray(notifications) ? notifications : []);
        }
    } catch (err) {
        console.warn("Notification poll failed", err);
    }
}

/**
 * Starts unread-notification polling. Safe to call multiple times.
 * Calls onChange whenever the unread set changes.
 */
export function startNotificationPolling(onChange, intervalMs = 15000) {
    if (intervalId) return;
    if (typeof onChange !== 'function') throw new Error('onChange callback is required');

    pollOnce(onChange);
    intervalId = setInterval(() => pollOnce(onChange), intervalMs);
}

export function stopNotificationPolling() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    lastSignature = null;
}