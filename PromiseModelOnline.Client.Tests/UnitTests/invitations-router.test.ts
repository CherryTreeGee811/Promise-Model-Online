import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn(), loadTemplateWithError: () => vi.fn(), showNotFound: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); });

describe('invitations/router', () => {
    it('loads template for /invitations', async () => {
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        await handleInvitationsRoute('/invitations', cd);
        expect(vi.mocked(loadTemplate)).toHaveBeenCalledWith('invitations/list.html', cd);
    });

    it('shows not found for non-matching path', async () => {
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        await handleInvitationsRoute('/other', cd);
        expect(vi.mocked(showNotFound)).toHaveBeenCalledWith(cd);
    });

    it('does not throw when loadTemplate fails', async () => {
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        vi.mocked(loadTemplate).mockRejectedValue(new Error('fail'));
        const cd = document.createElement('div');
        await expect(handleInvitationsRoute('/invitations', cd)).resolves.toBeUndefined();
    });
});

describe('knowledge-base/router', () => {
    it('loads template for /knowledge-base', async () => {
        const { handleKnowledgeBaseRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        await handleKnowledgeBaseRoutes('/knowledge-base', nav, cd);
        expect(vi.mocked(loadTemplate)).toHaveBeenCalled();
    });
});

describe('notifications/router', () => {
    it('loads template for /notifications', async () => {
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        await handleNotificationsRoutes('/notifications', nav, cd);
        expect(vi.mocked(loadTemplate)).toHaveBeenCalled();
    });

    it('shows not found for non-matching notifications path', async () => {
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        await handleNotificationsRoutes('/other', nav, cd);
        expect(vi.mocked(showNotFound)).toHaveBeenCalledWith(cd);
    });

    it('does not throw when loadTemplate fails for notifications', async () => {
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        vi.mocked(loadTemplate).mockRejectedValue(new Error('fail'));
        const nav = document.createElement('div'); const cd = document.createElement('div');
        await expect(handleNotificationsRoutes('/notifications', nav, cd)).resolves.toBeUndefined();
    });
});

describe('strides/router', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/router.ts');
        expect(mod.loadStridesPage).toBeDefined();
    });
});
