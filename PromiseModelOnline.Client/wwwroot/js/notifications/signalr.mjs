import * as signalR from "https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/+esm";

const NOTIFICATIONS_EVENT = "pmo:notifications:unread-updated";

let connection = null;
let started = false;

/**
 * Starts the SignalR connection (singleton)
 */
export async function startNotificationHub() {
    if (started) return;
    started = true;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("/hubs/notifications")
        .withAutomaticReconnect()
        .build();

    // ✅ Server pushes full unread set
    connection.on("NotificationsUpdated", (notifications) => {
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, {
            detail: {
                notifications: Array.isArray(notifications) ? notifications : []
            }
        }));
    });

    // ✅ Optional: single notification event
    connection.on("NotificationCreated", (notification) => {
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, {
            detail: {
                notifications: [notification]
            }
        }));
    });

    try {
        await connection.start();
        console.log("✅ SignalR connected");
    } catch (err) {
        console.error("❌ SignalR connection failed", err);
    }
}