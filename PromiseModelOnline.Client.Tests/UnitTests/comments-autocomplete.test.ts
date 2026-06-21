import { describe, it, expect, vi } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.api.ts', () => ({
    searchUsers: vi.fn().mockResolvedValue([{ userId: 1, userName: 'jdoe' }]),
    searchPromises: vi.fn().mockResolvedValue([]),
}));

describe('createCommentAutocomplete', () => {
    it('returns controller with destroy method', async () => {
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        const textarea = document.createElement('textarea');
        document.body.append(textarea);
        const controller = createCommentAutocomplete(textarea, 'Moment', '100');
        expect(controller).toHaveProperty('destroy');
        textarea.remove();
    });
});
