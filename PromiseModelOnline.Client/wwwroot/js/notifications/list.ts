// @ts-nocheck
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { escapeHtml } from '../utils/html.ts';

import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.ts';
import { getUnreadNotificationsEventName, updateNotificationBadge } from './badge.ts';

const _listState = { isLiveListenerRegistered: false };

/**
 * Update the notification badge count in the UI.
 * @param {number} count - The new badge count.
 */
function setBadgeCount(count) {
    const badge = /** @type {HTMLElement|null} */ (document.querySelector('#notification-badge'));
    if (!badge) return;

    const safeCount = Number.isFinite(count) ? count : 0;

    if (safeCount > 0) {
        badge.textContent = String(safeCount);
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

/** Decrement the badge count by one if the badge is visible. */
function decrementBadgeIfVisible() {
    const badge = /** @type {HTMLElement|null} */ (document.querySelector('#notification-badge'));
    if (!badge || badge.style.display === 'none') return;

    const current = parseInt(badge.textContent || '0', 10);

    if (!Number.isFinite(current) || current <= 0) {
        setBadgeCount(0);
        return;
    }

    setBadgeCount(current - 1);
}

/**
 * Mark a notification table row as read by removing the unread class and updating the actions cell.
 * @param {HTMLElement|null} row - The table row element to mark as read.
 */
function markRowRead(row) {
    if (!row) return;

    const wasUnread = row.classList.contains('unread');
    row.classList.remove('unread');

    const actionsCell = /** @type {HTMLElement|null} */ (row.querySelector('td[data-actions="1"]'));
    if (actionsCell) {
        actionsCell.textContent = '✓ Read';
    }

    if (wasUnread) {
        decrementBadgeIfVisible();
    }
}

/**
 * @typedef {{ id: number, message: string, type: string, createdAt: string, isRead: boolean }} Notification
 */

/**
 * Render the list of notifications into the given container div.
 * @param {HTMLElement} listDiv - The container element to render into.
 * @param {Notification[]} notifications - Array of notification objects.
 */
function renderNotificationsInto(listDiv, notifications) {
    if (!listDiv) return;

    if (!notifications || notifications.length === 0) {
        listDiv.innerHTML = renderEmptyStateSection({
            icon: 'bi-bell',
            title: 'No notifications yet.',
            description: 'You\'ll see notifications here when there is activity related to you.',
        });
        return;
    }

    listDiv.innerHTML = `
        <div class="mb-3">
            <button id="mark-all-read" class="btn btn-primary btn-sm" type="button">Mark All as Read</button>
        </div>
        <table class="table table-sm table-striped table-hover align-middle">
            <thead>
                <tr>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${notifications.map(n => `
                    <tr class="${n.isRead ? '' : 'unread'}" data-notification-id="${n.id}">
                        <td>${escapeHtml(n.message)}</td>
                        <td>${n.type}</td>
                        <td>${new Date(n.createdAt).toLocaleString('en-CA')}</td>
                        <td data-actions="1">
                            ${n.isRead 
                                ? '✓ Read' 
                                : `<button class="btn btn-sm btn-outline-primary mark-read-btn" type="button" data-id="${n.id}">Read</button>`}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelector('#mark-all-read')?.addEventListener('click', async () => {
        try {
            await markAllNotificationsAsRead();

            const y = window.scrollY;

            for (const tr of listDiv.querySelectorAll(':scope tbody tr')) {
                tr.classList.remove('unread');

                const actionsCell = /** @type {HTMLElement|null} */ (tr.querySelector(':scope > td[data-actions="1"]'));
                if (actionsCell) actionsCell.textContent = '✓ Read';
            }

            setBadgeCount(0);
            window.scrollTo(0, y);

        } catch (error) {
            alert('Failed to mark all as read');
            console.error(error);
        }
    });

    for (const button of listDiv.querySelectorAll('.mark-read-btn')) {
        button.addEventListener('click', async () => {
            const id = parseInt(/** @type {string} */(button.dataset.id), 10);

            try {
                await markNotificationAsRead(id);

                const y = window.scrollY;

                const row = listDiv.querySelector(`tr[data-notification-id="${CSS.escape(id)}"]`);
                markRowRead(row);

                window.scrollTo(0, y);

            } catch (error) {
                alert('Failed to mark notification as read');
                console.error(error);
            }
        });
    }
}

/** Refresh the notifications page by fetching all notifications and re-rendering. */
async function refreshNotificationsPage() {
    const listDiv = /** @type {HTMLElement|null} */ (document.querySelector('#notifications-list'));
    const errorElement = /** @type {HTMLElement|null} */ (document.querySelector('#error-text'));

    if (!listDiv || !errorElement) return;

    errorElement.textContent = '';

    try {
        const notifications = await fetchAllNotifications();

        renderNotificationsInto(listDiv, notifications);

        updateNotificationBadge();

    } catch {
        errorElement.textContent = 'Failed to load notifications.';
    }
}

/**
 * Load the notifications listing page.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function loadNotificationsPage(contentDiv) {
    if (!_listState.isLiveListenerRegistered) {
        _listState.isLiveListenerRegistered = true;

        const eventName = getUnreadNotificationsEventName();

        addEventListener(eventName, (/** @type {CustomEvent} */ event) => {
            const listDiv = /** @type {HTMLElement|null} */ (document.querySelector('#notifications-list'));
            if (!listDiv) return;

            const notifications = event?.detail?.notifications;

            renderNotificationsInto(
                listDiv,
                Array.isArray(notifications) ? notifications : []
            );
        });
    }

    refreshNotificationsPage();
}
