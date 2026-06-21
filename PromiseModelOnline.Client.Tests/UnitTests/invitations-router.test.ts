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
});

describe('strides/router', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/router.ts');
        expect(mod.loadStridesPage).toBeDefined();
    });
});
