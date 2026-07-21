import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({ getUsername: () => 'testuser', isLoggedIn: () => true }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="comments-section"></div><div id="reactions-section"></div>';
});

describe('loadComments', () => {
    it('fetches comments for entity', async () => {
        // Arrange
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);
        const container = document.createElement('div');
        // Act
        await loadComments(container, 'Moment', 100, 'o', 'p', { permission: 'Edit' });
        // Assert
        expect(apiGet).toHaveBeenCalled();
    });
});

describe('loadReactions', () => {
    it('fetches reactions for entity', async () => {
        // Arrange
        const { loadReactions } = await import('../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);
        const container = document.createElement('div');
        // Act
        loadReactions(container, 'Promise', '1', 'o', 'p', { permission: 'Edit' });
        // Assert
        expect(apiGet).toHaveBeenCalled();
    });
});
