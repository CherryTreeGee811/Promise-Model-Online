/** @typedef {import("@microsoft/signalr").HubConnection} HubConnection */
import { showToast } from '../ui/toast.ts';

const state: {
    connection: { start: () => Promise<void>; stop: () => Promise<void>; on: (event: string, handler: (...eventData: unknown[]) => void) => void; onreconnecting: (handler: () => void) => void; onreconnected: (handler: () => void) => void; onclose: (handler: () => void) => void; state: number } | undefined;
    onNotificationOrReconnect: ((data?: unknown) => void) | undefined;
    isStarted: boolean;
} = {
    connection: undefined as { start: () => Promise<void>; stop: () => Promise<void>; on: (event: string, handler: (...eventData: unknown[]) => void) => void; onreconnecting: (handler: () => void) => void; onreconnected: (handler: () => void) => void; onclose: (handler: () => void) => void; state: number } | undefined,
    onNotificationOrReconnect: undefined,
    isStarted: false,
};

const signalrGuard = { isStarted: false };

/**
 * Start the SignalR connection to the notifications hub.
 * Registers a callback for incoming notifications, reconnection, and connection state toasts.
 * The connection uses automatic reconnect with incremental delays.
 * @param {((data?: unknown) => void)} onNotification - Callback invoked with notification data on new notifications,
 *                                          or with null after a successful reconnect.
 * @returns {Promise<void>}
 */
export async function startSignalR(onNotification: (data?: unknown) => void) {
    if (signalrGuard.isStarted) return;
    signalrGuard.isStarted = true;

    const notificationCallback = typeof onNotification === 'function' ? onNotification : undefined;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/notifications')
        .withAutomaticReconnect([0, 2000, 5000, 10_000, 30_000])
        .configureLogging((signalR as unknown as { LogLevel: { Warning: number } }).LogLevel.Warning)
        .build();

    connection.on('ReceiveNotification', (notification) => {
        if (notificationCallback) {
            notificationCallback(notification);
        }
    });

    connection.onreconnecting(async () => {
        showToast('Reconnecting to server...', 'warning', 0);
    });

    connection.onreconnected(async () => {
        showToast('Reconnected.', 'success', 3000);
        if (notificationCallback) {
            notificationCallback(undefined);
        }
    });

    connection.onclose(async () => {
        showToast('Connection lost. Real-time updates paused.', 'error', 5000);
    });

    try {
        await connection.start();
    } catch (error) {
        console.warn('SignalR connection failed, notifications will not be real-time:', error);
        showToast('Unable to connect to notification service.', 'warning', 5000);
        return;
    }

    state.connection = connection;
    state.onNotificationOrReconnect = notificationCallback;
    state.isStarted = true;
}

