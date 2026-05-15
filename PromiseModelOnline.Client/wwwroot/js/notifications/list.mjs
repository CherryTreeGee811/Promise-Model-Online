import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.mjs';
import { getUnreadNotificationsEventName, updateNotificationBadge } from './badge.mjs';

let liveListenerRegistered = false;

function renderNotificationsInto(listDiv, notifications) {
    if (!listDiv) return;

    if (!notifications || notifications.length === 0) {
        listDiv.innerHTML = '<p class="no-items">No notifications yet.</p>';
        return;
    }

    listDiv.innerHTML = `
        <button id="mark-all-read" class="view-btn">Mark All as Read</button>
        <table class="promisemodel-table">
            <thead><tr><th>Message</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
                ${notifications.map(n => `
                    <tr class="${n.isRead ? '' : 'unread'}">
                        <td>${escapeHtml(n.message)}</td>
                        <td>${n.type}</td>
                        <td>${new Date(n.createdAt).toLocaleString('en-CA')}</td>
                        <td>
                            ${!n.isRead ? `<button class="mark-read-btn" data-id="${n.id}">Read</button>` : '✓ Read'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Mark all as read
    document.getElementById('mark-all-read')?.addEventListener('click', async () => {
        await markAllNotificationsAsRead();
        refreshNotificationsPage();
    });

    // Individual mark read
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id, 10);
            await markNotificationAsRead(id);
            refreshNotificationsPage();
        });
    });
}

async function refreshNotificationsPage() {
    const listDiv = document.getElementById('notifications-list');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    if (!listDiv || !errorEl || !loadingEl) return;

    loadingEl.textContent = 'Loading notifications…';
    errorEl.textContent = '';
    try {
        const notifications = await fetchAllNotifications();
        loadingEl.textContent = '';
        renderNotificationsInto(listDiv, notifications);
        updateNotificationBadge();
    } catch {
        loadingEl.textContent = '';
        errorEl.textContent = 'Failed to load notifications.';
    }
}

export function loadNotificationsPage(contentDiv) {
    // Live updates from background polling (no manual refresh required).
    if (!liveListenerRegistered) {
        liveListenerRegistered = true;
        const eventName = getUnreadNotificationsEventName();
        window.addEventListener(eventName, (e) => {
            const currentListDiv = document.getElementById('notifications-list');
            if (!currentListDiv) return;
            const notifications = e?.detail?.notifications;
            renderNotificationsInto(currentListDiv, Array.isArray(notifications) ? notifications : []);
        });
    }

    refreshNotificationsPage();
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}