/** @typedef {import("@microsoft/signalr").HubConnection} HubConnection */
import { showToast } from '../ui/toast.ts';

declare const signalR: any;

const state: {
    connection: any;
    onNotificationOrReconnect: ((data?: unknown) => void) | undefined;
    isStarted: boolean;
} = {
    connection: undefined as any,
    onNotificationOrReconnect: undefined,
    isStarted: false,
};

/**
 * Start the SignalR connection to the notifications hub.
 * Registers a callback for incoming notifications, reconnection, and connection state toasts.
 * The connection uses automatic reconnect with incremental delays.
 * @param {((data?: unknown) => void)} onNotification - Callback invoked with notification data on new notifications,
 *                                          or with null after a successful reconnect.
 * @returns {Promise<void>}
 */
export async function startSignalR(onNotification) {
    if (state.isStarted) return;

    state.onNotificationOrReconnect = typeof onNotification === 'function' ? onNotification : undefined;

    state.connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/notifications')
        .withAutomaticReconnect([0, 2000, 5000, 10_000, 30_000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    state.connection.on('ReceiveNotification', (notification) => {
        if (state.onNotificationOrReconnect) {
            state.onNotificationOrReconnect(notification);
        }
    });

    state.connection.onreconnecting(async () => {
        showToast('Reconnecting to server...', 'warning', 0);
    });

    state.connection.onreconnected(async () => {
        showToast('Reconnected.', 'success', 3000);
        if (state.onNotificationOrReconnect) {
            state.onNotificationOrReconnect(undefined);
        }
    });

    state.connection.onclose(async () => {
        showToast('Connection lost. Real-time updates paused.', 'error', 5000);
    });

    try {
        await state.connection.start();
        state.isStarted = true;
    } catch (error) {
        console.warn('SignalR connection failed, notifications will not be real-time:', error);
        showToast('Unable to connect to notification service.', 'warning', 5000);
        delete state.connection;
    }
}

