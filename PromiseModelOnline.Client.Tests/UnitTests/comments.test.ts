import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPatch: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({
    showToast: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({
    createCommentAutocomplete: vi.fn(() => ({ destroy: vi.fn() })),
}));

function flushPromises(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

describe('loadComments', () => {
    let container: HTMLElement;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
        window.scrollTo = vi.fn();
    });

    it('renders heading and empty comments list with canComment permission', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        vi.mocked(apiGet).mockResolvedValue([]);

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        expect(container.querySelector('h3')?.textContent).toBe('Comments');
        expect(container.querySelector('#comments-list')).toBeTruthy();
        expect(container.querySelector('#comment-form')).toBeTruthy();
        expect(container.querySelector('#comment-textarea')).toBeTruthy();
        const emptyDiv = container.querySelector('.no-items');
        expect(emptyDiv).toBeTruthy();
        expect(emptyDiv?.textContent).toContain('No comments yet');
        expect(emptyDiv?.textContent).toContain('Be the first');
        expect(createCommentAutocomplete).toHaveBeenCalledWith(
            container.querySelector('#comment-textarea'), 'Moment', 123
        );
    });

    it('renders heading without form when canComment is false', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        expect(container.querySelector('#comment-form')).toBeNull();
        expect(container.querySelector('.no-items')?.textContent).not.toContain('Be the first');
    });

    it('renders error message when API fails', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        const errorEl = container.querySelector('.error');
        expect(errorEl).toBeTruthy();
        expect(errorEl?.textContent).toBe('Failed to load comments.');
    });

    it('renders comment items when data is returned', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [
            { userName: 'Alice', createdAt: '2024-01-15T10:00:00Z', text: 'Great work!' },
            { userName: 'Bob', createdAt: '2024-01-16T12:00:00Z', text: 'Thanks Alice' },
        ];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        const items = container.querySelectorAll('.comment-item');
        expect(items.length).toBe(2);
        expect(items[0].querySelector('strong')?.textContent).toBe('Alice');
        expect(items[1].querySelector('strong')?.textContent).toBe('Bob');
    });

    it('submits form and appends comment', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet, apiPost } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        const createdComment = { id: 1, userName: 'Me', createdAt: new Date().toISOString(), text: 'New comment' };
        vi.mocked(apiGet).mockResolvedValue([]);
        vi.mocked(apiPost).mockResolvedValue(createdComment);

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        textarea.value = 'New comment';
        form.dispatchEvent(new Event('submit'));

        await vi.waitFor(() => {
            expect(apiPost).toHaveBeenCalledWith('/api/comments', {
                parentType: 'Moment',
                parentId: 123,
                text: 'New comment',
            });
        });
        expect(textarea.value).toBe('');
        expect(container.querySelectorAll('.comment-item').length).toBe(1);
        expect(container.querySelector('.comment-item strong')?.textContent).toBe('Me');
        expect(showToast).not.toHaveBeenCalled();
    });

    it('ignores submission with empty text', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet, apiPost } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue([]);

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        textarea.value = '   ';
        form.dispatchEvent(new Event('submit'));

        await flushPromises();
        expect(apiPost).not.toHaveBeenCalled();
    });

    it('shows toast on form submission failure', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet, apiPost } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        vi.mocked(apiGet).mockResolvedValue([]);
        vi.mocked(apiPost).mockRejectedValue(new Error('Post failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        textarea.value = 'Test';
        form.dispatchEvent(new Event('submit'));

        await vi.waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Failed to post comment.', 'error');
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('removes empty state when appending first comment', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet, apiPost } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const createdComment = { id: 1, userName: 'Me', createdAt: new Date().toISOString(), text: 'First!' };
        vi.mocked(apiGet).mockResolvedValue([]);
        vi.mocked(apiPost).mockResolvedValue(createdComment);

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        expect(container.querySelector('.no-items')).toBeTruthy();

        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        textarea.value = 'First!';
        form.dispatchEvent(new Event('submit'));

        await vi.waitFor(() => {
            expect(container.querySelector('.no-items')).toBeNull();
        });
    });

    it('renders comment with mentions and replies', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [{
            userName: 'Bob',
            createdAt: '2024-01-15T10:00:00Z',
            text: 'Hello @alice check #promise-1',
            mentionedUsers: ['alice'],
            replies: [{ userName: 'Alice', text: 'Got it!' }],
        }];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        const mentions = container.querySelector('.comment-mentions');
        expect(mentions).toBeTruthy();
        expect(mentions?.textContent).toContain('alice');

        const reply = container.querySelector('.comment-replies .reply');
        expect(reply).toBeTruthy();
        expect(reply?.querySelector('strong')?.textContent).toBe('Alice');
        expect(reply?.textContent).toContain('Got it!');
    });

    it('uses authorName when userName is missing', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [{
            authorName: 'Charlie',
            createdAt: '2024-01-15T10:00:00Z',
            text: 'Hello',
        }];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        expect(container.querySelector('.comment-item strong')?.textContent).toBe('Charlie');
    });

    it('appends comment when comments already exist', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet, apiPost } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const existingComments = [
            { userName: 'Alice', createdAt: '2024-01-15T10:00:00Z', text: 'First!' },
        ];
        const newComment = { id: 2, userName: 'Bob', createdAt: new Date().toISOString(), text: 'Reply!' };
        vi.mocked(apiGet).mockResolvedValue(existingComments);
        vi.mocked(apiPost).mockResolvedValue(newComment);

        await loadComments(container, 'Moment', 123, 'owner', 'project', { permission: 'Edit' });

        expect(container.querySelectorAll('.comment-item').length).toBe(1);

        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        textarea.value = 'Reply!';
        form.dispatchEvent(new Event('submit'));

        await vi.waitFor(() => {
            expect(container.querySelectorAll('.comment-item').length).toBe(2);
        });
    });

    it('shows Unknown for reply when no userName or authorName', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [{
            userName: 'Bob',
            createdAt: '2024-01-15T10:00:00Z',
            text: 'Hello',
            replies: [{ text: 'No name' }],
        }];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        const reply = container.querySelector('.comment-replies .reply');
        expect(reply?.querySelector('strong')?.textContent).toBe('Unknown');
    });

    it('renders reply with authorName fallback', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [{
            userName: 'Bob',
            createdAt: '2024-01-15T10:00:00Z',
            text: 'Hello',
            replies: [{ authorName: 'Alice', text: 'Got it!' }],
        }];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        const reply = container.querySelector('.comment-replies .reply');
        expect(reply?.querySelector('strong')?.textContent).toBe('Alice');
    });

    it('shows Unknown when no userName or authorName', async () => {
        const { loadComments } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        const comments = [{
            createdAt: '2024-01-15T10:00:00Z',
            text: 'Hello',
        }];
        vi.mocked(apiGet).mockResolvedValue(comments);

        await loadComments(container, 'Moment', 123, 'owner', 'project');

        expect(container.querySelector('.comment-item strong')?.textContent).toBe('Unknown');
    });
});
