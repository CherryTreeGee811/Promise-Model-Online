// @ts-nocheck
/** @typedef {import("@microsoft/signalr").HubConnection} HubConnection */
import { showToast } from '../ui/toast.ts';

/** @type {HubConnection|null} */
let connection = null;
/** @type {((data?: unknown) => void)|null} */
let onNotificationOrReconnect = null;
let isStarted = false;

/**
 * Start the SignalR connection to the notifications hub.
 * Registers a callback for incoming notifications, reconnection, and connection state toasts.
 * The connection uses automatic reconnect with incremental delays.
 * @param {((data?: unknown) => void)|null} onNotification - Callback invoked with notification data on new notifications,
 *                                          or with null after a successful reconnect.
 * @returns {Promise<void>}
 */
export async function startSignalR(onNotification) {
    if (isStarted) return;

    onNotificationOrReconnect = typeof onNotification === 'function' ? onNotification : null;

    connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/notifications')
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    connection.on('ReceiveNotification', (notification) => {
        if (onNotificationOrReconnect) {
            onNotificationOrReconnect(notification);
        }
    });

    connection.onreconnecting(async () => {
        showToast('Reconnecting to server...', 'warning', 0);
    });

    connection.onreconnected(async () => {
        showToast('Reconnected.', 'success', 3000);
        if (onNotificationOrReconnect) {
            onNotificationOrReconnect(null);
        }
    });

    connection.onclose(async () => {
        showToast('Connection lost. Real-time updates paused.', 'error', 5000);
    });

    try {
        await connection.start();
        isStarted = true;
    } catch (err) {
        console.warn('SignalR connection failed, notifications will not be real-time:', err);
        showToast('Unable to connect to notification service.', 'warning', 5000);
        connection = null;
    }
}

/**
 * Stop the SignalR connection.
 * @returns {Promise<void>}
 */
export async function stopSignalR() {
    if (connection) {
        try {
            await connection.stop();
        } catch {
        }
        connection = null;
    }
    isStarted = false;
    onNotificationOrReconnect = null;
}

/**
 * Check if the SignalR connection is currently active.
 * @returns {boolean} True if the SignalR connection state is Connected.
 */
export function isSignalRConnected() {
    return connection && connection.state === signalR.HubConnectionState.Connected;
}
