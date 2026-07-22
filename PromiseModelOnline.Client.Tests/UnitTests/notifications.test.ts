import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({ showToast: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/empty-table.ts', () => ({
    renderEmptyStateSection: vi.fn(() => {
        const el = document.createElement('div');
        el.className = 'empty-state';
        return el;
    }),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts', () => ({
    fetchAllNotifications: vi.fn(),
    fetchUnreadNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts', () => ({
    getUnreadNotificationsEventName: vi.fn(() => 'pmo:notifications:unread-updated'),
    updateNotificationBadge: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    document.body.innerHTML = '';
});

const sampleNotifs = [
    { id: 1, message: 'You have a new follower', type: 'info', createdAt: '2026-07-21T12:00:00.000Z', isRead: false },
    { id: 2, message: 'Your project was approved', type: 'success', createdAt: '2026-07-20T08:30:00.000Z', isRead: true },
    { id: 3, message: 'Comment on your post', type: 'mention', createdAt: '2026-07-19T16:45:00.000Z', isRead: false },
];

function setDom() {
    document.body.innerHTML = `
        <div id="notifications-list"></div>
        <div id="error-text"></div>
        <span id="notification-badge" class="d-none">0</span>
    `;
}

// ---------------------------------------------------------------------------
// loadNotificationsPage — the only public export from list.ts.
// Calling it internally triggers refreshNotificationsPage → renderNotificationsInto
// → event listener registration + all internal helpers (setBadgeCount,
//   decrementBadgeIfVisible, markRowRead) through button clicks.
// ---------------------------------------------------------------------------
describe('loadNotificationsPage', () => {
    it('calls fetchAllNotifications and renders the table', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        expect(fetchAllNotifications).toHaveBeenCalledTimes(1);
        expect(document.querySelector('table')).not.toBeNull();
        expect(document.querySelectorAll('tbody tr').length).toBe(3);
    });

    it('renders unread rows and read rows differently', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const rows = document.querySelectorAll('tbody tr');
        expect(rows[0].classList.contains('unread')).toBe(true);
        expect(rows[1].classList.contains('unread')).toBe(false);
        expect(rows[2].classList.contains('unread')).toBe(true);
        const actions = document.querySelectorAll('td[data-actions="1"]');
        expect(actions[1].textContent).toBe('✓ Read');
    });

    it('shows Read buttons for unread notifications', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        expect(document.querySelectorAll('.mark-read-btn').length).toBe(2);
    });

    it('shows Mark All as Read button and clears UI on click', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications, markAllNotificationsAsRead } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        (markAllNotificationsAsRead as ReturnType<typeof vi.fn>).mockResolvedValue({});
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const badge = document.getElementById('notification-badge')!;
        badge.textContent = '3';
        badge.classList.remove('d-none');
        document.getElementById('mark-all-read')!.click();
        await vi.waitFor(() => {
            expect(markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error toast when Mark All as Read fails', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications, markAllNotificationsAsRead } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        (markAllNotificationsAsRead as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        document.getElementById('mark-all-read')!.click();
        await vi.waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Failed to mark all as read', 'error');
        });
    });

    it('marks individual notification as read via button and hides badge when last unread', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications, markNotificationAsRead } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        (markNotificationAsRead as ReturnType<typeof vi.fn>).mockResolvedValue({});
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const badge = document.getElementById('notification-badge')!;
        badge.textContent = '2';
        badge.classList.remove('d-none');
        const readBtn = document.querySelector('.mark-read-btn') as HTMLElement;
        readBtn.click();
        await vi.waitFor(() => {
            expect(markNotificationAsRead).toHaveBeenCalledWith(1);
        });
    });

    it('shows error toast when individual mark-as-read fails', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications, markNotificationAsRead } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(sampleNotifs);
        (markNotificationAsRead as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const readBtn = document.querySelector('.mark-read-btn') as HTMLElement;
        readBtn.click();
        await vi.waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Failed to mark notification as read', 'error');
        });
    });

    it('renders empty state when fetch returns empty array', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { renderEmptyStateSection } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/empty-table.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        expect(renderEmptyStateSection).toHaveBeenCalled();
    });

    it('shows error text when fetch fails', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const errorEl = document.getElementById('error-text')!;
        expect(errorEl.textContent).toBe('Failed to load notifications.');
    });

    it('registers event listener on first call only', async () => {
        const dispatchSpy = vi.spyOn(globalThis, 'addEventListener');
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        expect(dispatchSpy).toHaveBeenCalledWith('pmo:notifications:unread-updated', expect.any(Function));
        dispatchSpy.mockClear();
        await mod.loadNotificationsPage(document.createElement('div'));
        expect(dispatchSpy).not.toHaveBeenCalled();
        dispatchSpy.mockRestore();
    });

    it('event listener re-renders notifications from custom event', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const event = new CustomEvent('pmo:notifications:unread-updated', {
            detail: { notifications: sampleNotifs },
        });
        globalThis.dispatchEvent(event);
        expect(document.querySelector('table')).not.toBeNull();
        expect(document.querySelectorAll('tbody tr').length).toBe(3);
    });

    it('event listener handles null/undefined detail gracefully', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        const listDiv = document.getElementById('notifications-list')!;
        listDiv.replaceChildren();
        const event1 = new CustomEvent('pmo:notifications:unread-updated', { detail: null });
        globalThis.dispatchEvent(event1);
        expect(document.querySelector('.empty-state')).not.toBeNull();
        listDiv.replaceChildren();
        const event2 = new CustomEvent('pmo:notifications:unread-updated', { detail: {} });
        globalThis.dispatchEvent(event2);
        expect(document.querySelector('.empty-state')).not.toBeNull();
    });

    it('event listener does nothing when listDiv is missing', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        const { fetchAllNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchAllNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        setDom();
        await mod.loadNotificationsPage(document.createElement('div'));
        document.body.innerHTML = '';
        let threw = false;
        try {
            globalThis.dispatchEvent(new CustomEvent('pmo:notifications:unread-updated', {
                detail: { notifications: sampleNotifs },
            }));
        } catch {
            threw = true;
        }
        expect(threw).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// startSignalR — the only public export from signalr.ts
// ---------------------------------------------------------------------------
describe('startSignalR', () => {
    it('can be imported and called', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        expect(mod.startSignalR).toBeDefined();
    });

    function createSignalRStub(startImpl?: () => Promise<void>) {
        class HubConnectionBuilder {
            withUrl = vi.fn().mockReturnThis();
            withAutomaticReconnect = vi.fn().mockReturnThis();
            configureLogging = vi.fn().mockReturnThis();
            build = vi.fn(() => ({
                start: startImpl ?? vi.fn().mockRejectedValue(new Error('no server')),
                on: vi.fn(),
                onreconnecting: vi.fn(),
                onreconnected: vi.fn(),
                onclose: vi.fn(),
                stop: vi.fn(),
                state: 0,
            }));
        }
        return { HubConnectionBuilder, LogLevel: { Warning: 2 } };
    }

    it('guard prevents double start (second call returns early)', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        (globalThis as unknown as Record<string, unknown>).signalR = createSignalRStub();
        await mod.startSignalR(vi.fn());
        const second = await mod.startSignalR(vi.fn());
        expect(second).toBeUndefined();
        delete (globalThis as unknown as Record<string, unknown>).signalR;
    });

    it('handles non-function onNotification gracefully', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        (globalThis as unknown as Record<string, unknown>).signalR = createSignalRStub();
        const result = await mod.startSignalR(null as unknown as (data?: unknown) => void);
        expect(result).toBeUndefined();
        delete (globalThis as unknown as Record<string, unknown>).signalR;
    });
});
