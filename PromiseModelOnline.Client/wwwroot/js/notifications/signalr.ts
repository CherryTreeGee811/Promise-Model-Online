// @ts-nocheck
/** @typedef {import("@microsoft/signalr").HubConnection} HubConnection */

/** @type {HubConnection|null} */
let connection = null;
/** @type {Function|null} */
let onNotificationOrReconnect = null;

/**
 * Start the SignalR connection to the notifications hub.
 * Registers a callback for incoming notifications and reconnection events.
 * The connection uses automatic reconnect with incremental delays.
 * @param {Function|null} onNotification - Callback invoked with notification data on new notifications,
 *                                          or with null after a successful reconnect.
 */
export async function startSignalR(onNotification) {
    if (connection) return;

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

    connection.onreconnected(async () => {
        if (onNotificationOrReconnect) {
            onNotificationOrReconnect(null);
        }
    });

    try {
        await connection.start();
    } catch (err) {
        console.warn('SignalR connection failed, notifications will not be real-time:', err);
        connection = null;
    }
}

/** Stop the SignalR connection. */
export async function stopSignalR() {
    if (connection) {
        try {
            await connection.stop();
        } catch {
        }
        connection = null;
        onNotificationOrReconnect = null;
    }
}

/**
 * Check if the SignalR connection is currently active.
 * @returns {boolean} True if the SignalR connection state is Connected.
 */
export function isSignalRConnected() {
    return connection && connection.state === signalR.HubConnectionState.Connected;
}
