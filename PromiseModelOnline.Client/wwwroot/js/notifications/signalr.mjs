let connection = null;
let onNotificationOrReconnect = null;

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

export function isSignalRConnected() {
    return connection && connection.state === signalR.HubConnectionState.Connected;
}
