import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts', () => ({
    fetchUnreadNotifications: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts', () => ({
    startSignalR: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    document.body.innerHTML = '';
});

async function getBadgeElement() {
    const el = document.createElement('span');
    el.id = 'notification-badge';
    document.body.appendChild(el);
    return el;
}

describe('getUnreadNotificationsEventName', () => {
    it('returns the correct event name', async () => {
        // Arrange
        const { getUnreadNotificationsEventName } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Assert
        expect(getUnreadNotificationsEventName()).toBe('pmo:notifications:unread-updated');
    });
});

describe('updateNotificationBadge', () => {
    it('updates badge count from fetchUnreadNotifications', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const badges = await getBadgeElement();
        badges.classList.add('d-none');
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await updateNotificationBadge();
        // Assert
        expect(badges.textContent).toBe('2');
        expect(badges.classList.contains('d-none')).toBe(false);
    });

    it('hides badge when count is 0', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const badges = await getBadgeElement();
        badges.textContent = '3';
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await updateNotificationBadge();
        // Assert
        expect(badges.classList.contains('d-none')).toBe(true);
    });

    it('handles non-array response as 0 count', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const badges = await getBadgeElement();
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await updateNotificationBadge();
        // Assert
        expect(badges.classList.contains('d-none')).toBe(true);
    });

    it('handles fetch error gracefully', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const badges = await getBadgeElement();
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await updateNotificationBadge();
        // Assert
        expect(badges.classList.contains('d-none')).toBe(true);
    });

    it('does nothing when badge element is missing', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        // Assert
        await expect(updateNotificationBadge()).resolves.toBeUndefined();
    });

    it('dispatches custom event with notifications detail', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        await getBadgeElement();
        const notifications = [{ id: 1 }, { id: 2 }];
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(notifications);
        const handler = vi.fn();
        globalThis.addEventListener('pmo:notifications:unread-updated', handler);
        const { updateNotificationBadge } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await updateNotificationBadge();
        // Assert
        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { notifications },
            })
        );
    });
});

describe('startNotificationPolling', () => {
    it('fetches notifications and starts SignalR on first call', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        await getBadgeElement();
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        const { startNotificationPolling } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await startNotificationPolling();
        // Assert
        expect(fetchUnreadNotifications).toHaveBeenCalledTimes(1);
        expect(startSignalR).toHaveBeenCalledTimes(1);
        expect(startSignalR).toHaveBeenCalledWith(expect.any(Function));
    });

    it('does not start SignalR again on subsequent calls', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        await getBadgeElement();
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        const { startNotificationPolling } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        await startNotificationPolling();
        // Act
        await startNotificationPolling();
        // Assert
        expect(fetchUnreadNotifications).toHaveBeenCalledTimes(2);
        expect(startSignalR).toHaveBeenCalledTimes(1);
    });

    it('SignalR callback invokes handleNotificationUpdate which calls fetchUnreadNotifications', async () => {
        // Arrange
        const { fetchUnreadNotifications } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/api.ts');
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        await getBadgeElement();
        (fetchUnreadNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        const { startNotificationPolling } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        // Act
        await startNotificationPolling();
        // Assert
        expect(fetchUnreadNotifications).toHaveBeenCalledTimes(1);
        const callback = (startSignalR as ReturnType<typeof vi.fn>).mock.calls[0][0];
        callback();
        expect(fetchUnreadNotifications).toHaveBeenCalledTimes(2);
    });
});
