import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.mjs';
import { getUnreadNotificationsEventName, updateNotificationBadge } from './badge.mjs';

let liveListenerRegistered = false;

function setBadgeCount(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const safeCount = Number.isFinite(count) ? count : 0;
    if (safeCount > 0) {
        badge.textContent = String(safeCount);
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

function decrementBadgeIfVisible() {
    const badge = document.getElementById('notification-badge');
    if (!badge || badge.style.display === 'none') return;
    const current = parseInt(badge.textContent || '0', 10);
    if (!Number.isFinite(current) || current <= 0) {
        setBadgeCount(0);
        return;
    }
    setBadgeCount(current - 1);
}

function markRowRead(row) {
    if (!row) return;
    const wasUnread = row.classList.contains('unread');
    row.classList.remove('unread');

    const actionsCell = row.querySelector('td[data-actions="1"]');
    if (actionsCell) {
        actionsCell.textContent = '✓ Read';
    }

    if (wasUnread) decrementBadgeIfVisible();
}

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
                    <tr class="${n.isRead ? '' : 'unread'}" data-notification-id="${n.id}">
                        <td>${escapeHtml(n.message)}</td>
                        <td>${n.type}</td>
                        <td>${new Date(n.createdAt).toLocaleString('en-CA')}</td>
                        <td data-actions="1">
                            ${!n.isRead ? `<button class="mark-read-btn" data-id="${n.id}">Read</button>` : '✓ Read'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Mark all as read
    document.getElementById('mark-all-read')?.addEventListener('click', async () => {
        try {
            await markAllNotificationsAsRead();
            const y = window.scrollY;
            listDiv.querySelectorAll('tbody tr').forEach(tr => {
                tr.classList.remove('unread');
                const actionsCell = tr.querySelector('td[data-actions="1"]');
                if (actionsCell) actionsCell.textContent = '✓ Read';
            });
            setBadgeCount(0);
            window.scrollTo(0, y);
        } catch (err) {
            alert('Failed to mark all as read');
            console.error(err);
        }
    });

    // Individual mark read
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id, 10);
            try {
                await markNotificationAsRead(id);
                const y = window.scrollY;
                const row = listDiv.querySelector(`tr[data-notification-id="${id}"]`);
                markRowRead(row);
                window.scrollTo(0, y);
            } catch (err) {
                alert('Failed to mark notification as read');
                console.error(err);
            }
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