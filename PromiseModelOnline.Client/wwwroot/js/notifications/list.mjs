import { fetchUnreadNotifications, fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.mjs';
import { updateNotificationBadge } from './badge.mjs';   // ← NEW

export function loadNotificationsPage(contentDiv) {
    const listDiv = document.getElementById('notifications-list');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    function renderNotifications(notifications) {
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
        document.getElementById('mark-all-read').addEventListener('click', async () => {
            await markAllNotificationsAsRead();
            refresh();                                 // refresh already calls updateNotificationBadge
        });

        // Individual mark read
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id, 10);
                await markNotificationAsRead(id);
                refresh(); 
            });
        });
    }

    async function refresh() {
        loadingEl.textContent = 'Loading notifications…';
        try {
            const notifications = await fetchAllNotifications();
            loadingEl.textContent = '';
            renderNotifications(notifications);
            updateNotificationBadge();
        } catch (err) {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load notifications.';
        }
    }

    refresh();
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}