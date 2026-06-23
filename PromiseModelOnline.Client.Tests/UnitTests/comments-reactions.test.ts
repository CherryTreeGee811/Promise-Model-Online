import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({ getUsername: () => 'testuser', isLoggedIn: () => true }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="comments-section"></div><div id="reactions-section"></div>';
});

describe('loadComments', () => {
    it('fetches comments for entity', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);
        const container = document.createElement('div');
        await loadComments(container, 'Moment', 100, 'o', 'p', { permission: 'Edit' });
        expect(apiGet).toHaveBeenCalled();
    });
});

describe('loadReactions', () => {
    it('fetches reactions for entity', async () => {
        const { loadReactions } = await import('../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);
        const container = document.createElement('div');
        loadReactions(container, 'Promise', '1', 'o', 'p', { permission: 'Edit' });
        expect(apiGet).toHaveBeenCalled();
    });
});
