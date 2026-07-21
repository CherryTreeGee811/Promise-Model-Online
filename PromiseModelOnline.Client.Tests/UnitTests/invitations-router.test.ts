import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn(), loadTemplateWithError: () => vi.fn(), showNotFound: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); });

describe('invitations/router', () => {
    it('loads template for /invitations', async () => {
        // Arrange
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        // Act
        await handleInvitationsRoute('/invitations', cd);
        // Assert
        expect(vi.mocked(loadTemplate)).toHaveBeenCalledWith('invitations/list.html', cd);
    });

    it('shows not found for non-matching path', async () => {
        // Arrange
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        // Act
        await handleInvitationsRoute('/other', cd);
        // Assert
        expect(vi.mocked(showNotFound)).toHaveBeenCalledWith(cd);
    });

    it('does not throw when loadTemplate fails', async () => {
        // Arrange
        const { handleInvitationsRoute } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        vi.mocked(loadTemplate).mockRejectedValue(new Error('fail'));
        // Act
        const cd = document.createElement('div');
        // Assert
        await expect(handleInvitationsRoute('/invitations', cd)).resolves.toBeUndefined();
    });
});

describe('knowledge-base/router', () => {
    it('loads template for /knowledge-base', async () => {
        // Arrange
        const { handleKnowledgeBaseRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        // Act
        await handleKnowledgeBaseRoutes('/knowledge-base', nav, cd);
        // Assert
        expect(vi.mocked(loadTemplate)).toHaveBeenCalled();
    });
});

describe('notifications/router', () => {
    it('loads template for /notifications', async () => {
        // Arrange
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        // Act
        await handleNotificationsRoutes('/notifications', nav, cd);
        // Assert
        expect(vi.mocked(loadTemplate)).toHaveBeenCalled();
    });

    it('shows not found for non-matching notifications path', async () => {
        // Arrange
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.createElement('div'); const cd = document.createElement('div');
        // Act
        await handleNotificationsRoutes('/other', nav, cd);
        // Assert
        expect(vi.mocked(showNotFound)).toHaveBeenCalledWith(cd);
    });

    it('does not throw when loadTemplate fails for notifications', async () => {
        // Arrange
        const { handleNotificationsRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts');
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        vi.mocked(loadTemplate).mockRejectedValue(new Error('fail'));
        // Act
        const nav = document.createElement('div'); const cd = document.createElement('div');
        // Assert
        await expect(handleNotificationsRoutes('/notifications', nav, cd)).resolves.toBeUndefined();
    });
});

describe('strides/router', () => {
    it('exports expected function', async () => {
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/router.ts');
        // Assert
        expect(mod.loadStridesPage).toBeDefined();
    });
});
