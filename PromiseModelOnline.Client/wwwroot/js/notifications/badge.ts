import { fetchUnreadNotifications } from './api.ts';
import { startSignalR } from './signalr.ts';

const NOTIFICATIONS_EVENT = 'pmo:notifications:unread-updated';
const _state = { isStarted: false };

/**
 * Update the notification badge DOM element with the given count.
 * Shows the badge when count > 0, hides it otherwise.
 * @param {number} count - The number of unread notifications.
 */
function setBadgeCount(count: number) {
    const badge = /** @type {HTMLElement} */ (document.querySelector('#notification-badge'));
    if (!badge) return;

    const safeCount = Number.isFinite(count) ? count : 0;
    if (safeCount > 0) {
        badge.textContent = String(safeCount);
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

/**
 * Fetch the latest unread notifications and update the badge count.
 * Dispatches a custom DOM event with the notification data so other
 * components can react to the update.
 */
async function handleNotificationUpdate() {
    try {
        const notifications = await fetchUnreadNotifications();
        const count = Array.isArray(notifications) ? notifications.length : 0;
        setBadgeCount(count);

        dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, {
            detail: { notifications: Array.isArray(notifications) ? notifications : [] }
        }));
    } catch {
        setBadgeCount(0);
    }
}

/** Update the notification badge with the latest unread count. */
export async function updateNotificationBadge() {
    await handleNotificationUpdate();
}

/**
 * Stop the notification polling loop.
 * Disconnects the SignalR hub and resets the started flag so that
/** Start polling for unread notification updates.
 */
export async function startNotificationPolling() {
    await handleNotificationUpdate();

    if (_state.isStarted) return;
    _state.isStarted = true;

    void startSignalR(() => {
        void handleNotificationUpdate();
    });
}

/**
 * Get the custom event name dispatched on unread count updates.
 * @returns {string} The event name string.
 */
export function getUnreadNotificationsEventName() {
    return NOTIFICATIONS_EVENT;
}
