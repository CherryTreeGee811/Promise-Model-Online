import { renderEmptyStateSection } from '../utils/empty-table.ts';

import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.ts';
import { getUnreadNotificationsEventName, updateNotificationBadge } from './badge.ts';

const _listState = { isLiveListenerRegistered: false };

/**
 * Update the notification badge count in the UI.
 * @param {number} count - The new badge count.
 */
function setBadgeCount(count: number) {
    const badge = document.querySelector('#notification-badge') as HTMLElement | null;
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
    const badge = document.querySelector('#notification-badge') as HTMLElement | null;
    if (!badge || badge.style.display === 'none') return;

    const current = Number(badge.textContent || '0');

    if (!Number.isFinite(current) || current <= 0) {
        setBadgeCount(0);
        return;
    }

    setBadgeCount(current - 1);
}

/**
 * Mark a notification table row as read by removing the unread class and updating the actions cell.
 * @param {HTMLElement} row - The table row element to mark as read.
 */
function markRowRead(row: HTMLElement) {
    if (!row) return;

    const wasUnread = row.classList.contains('unread');
    row.classList.remove('unread');

    const actionsCell = /** @type {HTMLElement} */ (row.querySelector('td[data-actions="1"]'));
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
function renderNotificationsInto(listDiv: HTMLElement, notifications: { id: number; message: string; type: string; createdAt: string; isRead: boolean }[]) {
    if (!listDiv) return;

    if (!notifications || notifications.length === 0) {
        listDiv.replaceChildren(renderEmptyStateSection({
            icon: 'bi-bell',
            title: 'No notifications yet.',
            description: 'You\'ll see notifications here when there is activity related to you.',
        }));
        return;
    }

    listDiv.replaceChildren();

    const toolbarDiv = document.createElement('div');
    toolbarDiv.className = 'mb-3';
    const markAllButton = document.createElement('button');
    markAllButton.id = 'mark-all-read';
    markAllButton.className = 'btn btn-primary btn-sm';
    markAllButton.type = 'button';
    markAllButton.textContent = 'Mark All as Read';
    toolbarDiv.append(markAllButton);
    listDiv.append(toolbarDiv);

    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-hover align-middle';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const text of ['Message', 'Type', 'Date', 'Actions']) {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.append(th);
    }
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    for (const n of notifications) {
        const tr = document.createElement('tr');
        if (!n.isRead) tr.className = 'unread';
        tr.dataset.notificationId = String(n.id);

        const messageTd = document.createElement('td');
        messageTd.textContent = n.message;
        tr.append(messageTd);

        const typeTd = document.createElement('td');
        typeTd.textContent = n.type;
        tr.append(typeTd);

        const dateTd = document.createElement('td');
        dateTd.textContent = new Date(n.createdAt).toLocaleString('en-CA');
        tr.append(dateTd);

        const actionsTd = document.createElement('td');
        actionsTd.dataset.actions = '1';
        if (n.isRead) {
            actionsTd.textContent = '✓ Read';
        } else {
            const readButton = document.createElement('button');
            readButton.className = 'btn btn-sm btn-outline-primary mark-read-btn';
            readButton.type = 'button';
            readButton.dataset.id = String(n.id);
            readButton.textContent = 'Read';
            actionsTd.append(readButton);
        }
        tr.append(actionsTd);
        tbody.append(tr);
    }
    table.append(tbody);
    listDiv.append(table);

    document.querySelector('#mark-all-read')?.addEventListener('click', async () => {
        try {
            await markAllNotificationsAsRead();

            const y = window.scrollY;

            for (const tr of listDiv.querySelectorAll(':scope tbody tr')) {
                tr.classList.remove('unread');

                const actionsCell = /** @type {HTMLElement} */ (tr.querySelector(':scope > td[data-actions="1"]'));
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
            const id = Number((button as HTMLElement).dataset.id!);

            try {
                await markNotificationAsRead(id);

                const y = window.scrollY;

                const row = listDiv.querySelector(`tr[data-notification-id="${CSS.escape(String(id))}"]`);
                if (row) markRowRead(row as HTMLElement);

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
    const listDiv = document.querySelector('#notifications-list') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;

    if (!listDiv || !errorElement) return;

    errorElement.textContent = '';

    try {
        const notifications = await fetchAllNotifications();

        renderNotificationsInto(listDiv!, notifications as { id: number; message: string; type: string; createdAt: string; isRead: boolean }[]);

        void updateNotificationBadge();

    } catch {
        errorElement.textContent = 'Failed to load notifications.';
    }
}

/**
 * Load the notifications listing page.
 * @param {HTMLElement} _contentDiv - The main content container element.
 */
export function loadNotificationsPage(_contentDiv: HTMLElement) {
    if (!_listState.isLiveListenerRegistered) {
        _listState.isLiveListenerRegistered = true;

        const eventName = getUnreadNotificationsEventName();

        addEventListener(eventName, (event: Event) => {
            const listDiv = document.querySelector('#notifications-list') as HTMLElement;
            if (!listDiv) return;

            const notifications = (event as CustomEvent)?.detail?.notifications;

            renderNotificationsInto(
                listDiv,
                Array.isArray(notifications) ? notifications : []
            );
        });
    }

    void refreshNotificationsPage();
}
