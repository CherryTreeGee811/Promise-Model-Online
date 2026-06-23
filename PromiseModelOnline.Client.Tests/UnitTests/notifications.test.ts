import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({ showToast: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="notifications-list"></div><div id="error-text"></div>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<div>mock</div>') });
});

describe('notifications module', () => {
    it('loadNotificationsPage is defined', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/list.ts');
        expect(mod.loadNotificationsPage).toBeDefined();
    });
});
