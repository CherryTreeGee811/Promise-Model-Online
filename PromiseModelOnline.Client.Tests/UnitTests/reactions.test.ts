import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/reactions/api.ts', () => ({
    getReactions: vi.fn(),
    addReaction: vi.fn(),
    updateReaction: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({
    showToast: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({
    getUsername: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.scrollTo = vi.fn();
});

describe('loadReactions', () => {
    async function load() {
        const { loadReactions } = await import('../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts');
        return loadReactions;
    }

    async function api() {
        return import('../../PromiseModelOnline.Client/wwwroot/js/reactions/api.ts');
    }

    async function auth() {
        return import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
    }

    async function toast() {
        return import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
    }

    describe('DOM structure', () => {
        it('renders reactions bar with picker when user has Comment permission', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            expect(container.querySelector('.reactions-bar')).toBeTruthy();
            expect(container.querySelector('.reactions-summary')).toBeTruthy();
            expect(container.querySelector('.reactions-picker')).toBeTruthy();
            const buttons = container.querySelectorAll('.emote-btn');
            expect(buttons.length).toBe(7);
            expect((buttons[0] as HTMLButtonElement).textContent).toBe('👍');
        });

        it('renders reactions bar with picker when user has Edit permission', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Edit' });

            expect(container.querySelector('.reactions-picker')).toBeTruthy();
        });

        it('renders reactions bar without picker when user lacks permission', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Owner' });

            expect(container.querySelector('.reactions-bar')).toBeTruthy();
            expect(container.querySelector('.reactions-summary')).toBeTruthy();
            expect(container.querySelector('.reactions-picker')).toBeNull();
        });

        it('renders reactions bar without picker when permission is undefined', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', {});

            expect(container.querySelector('.reactions-picker')).toBeNull();
        });

        it('renders reactions bar without picker when permission is nullish', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', {});

            expect(container.querySelector('.reactions-picker')).toBeNull();
        });
    });

    describe('refresh (API fetch on init)', () => {
        it('handles getReactions returning null (reactions || [] fallback)', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue(null as unknown as Record<string, unknown>[]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('No reactions yet.');
            });
        });

        it('handles getReactions returning undefined (reactions || [] fallback)', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue(undefined as unknown as Record<string, unknown>[]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('No reactions yet.');
            });
        });

        it('handles missing summary element gracefully (querySelector returns null)', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            vi.spyOn(container, 'querySelector').mockReturnValue(null);
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });
        });

        it('calls getReactions with correct arguments', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Moment', '42', 'owner', 'project', { permission: 'Edit' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalledWith('owner', 'project', 'Moment', '42');
            });
        });

        it('renders "No reactions yet." when API returns empty array', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('No reactions yet.');
            });
        });

        it('renders emote counts from API response', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 1, emote: '👍', userName: 'alice' },
                { id: 2, emote: '👍', userName: 'bob' },
                { id: 3, emote: '❤️', userName: 'carol' },
                { id: 4, emote: '🚀', userName: 'dave' },
            ]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('👍 2 ❤️ 1 🚀 1');
            });
        });

        it('identifies user\'s own reaction when username matches', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('alice');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 99, emote: '👍', userName: 'alice' },
            ]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelector('.emote-btn') as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(m.updateReaction).toHaveBeenCalledWith('owner', 'project', 99, '👍');
            });
        });

        it('handles missing username gracefully', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue(undefined as unknown as string);
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 99, emote: '👍', userName: 'alice' },
            ]);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelector('.emote-btn') as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(m.addReaction).toHaveBeenCalled();
            });
        });

        it('shows "Failed to load reactions." when API throws', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockRejectedValue(new Error('Network error'));

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('Failed to load reactions.');
            });
        });

        it('handles API error with null summaryElement gracefully', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockRejectedValue(new Error('Network error'));

            const loadReactions = await load();
            const container = document.createElement('div');
            vi.spyOn(container, 'querySelector').mockReturnValue(null);
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });
        });
    });

    describe('click handler - addReaction (no prior reaction)', () => {
        it('calls addReaction when clicking with no existing reaction', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);
            vi.mocked(m.addReaction).mockResolvedValue({ id: 1, emote: '🎉' });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelectorAll('.emote-btn')[4] as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(m.addReaction).toHaveBeenCalledWith('owner', 'project', {
                    stackItemType: 'Promise',
                    stackItemId: 1,
                    emote: '🎉',
                });
            });
        });

        it('increments count for the clicked emote when no prior reaction', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);
            vi.mocked(m.addReaction).mockResolvedValue({ id: 1, emote: '🚀' });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelectorAll('.emote-btn')[5] as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('🚀 1');
            });
        });
    });

    describe('click handler - updateReaction (prior reaction exists)', () => {
        it('calls updateReaction when user has existing reaction', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
            ]);
            vi.mocked(m.updateReaction).mockResolvedValue({ id: 6, emote: '❤️' });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const heartButton = container.querySelectorAll('.emote-btn')[2] as HTMLButtonElement;
            heartButton.click();

            await vi.waitFor(() => {
                expect(m.updateReaction).toHaveBeenCalledWith('owner', 'project', 5, '❤️');
            });
        });

        it('decrements old emote count and increments new emote count', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
                { id: 10, emote: '👍', userName: 'otheruser' },
            ]);
            vi.mocked(m.updateReaction).mockResolvedValue({ id: 6, emote: '❤️' });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const heartButton = container.querySelectorAll('.emote-btn')[2] as HTMLButtonElement;
            heartButton.click();

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toContain('👍 1');
                expect(summary?.textContent).toContain('❤️ 1');
            });
        });

        it('clicking the same emote leaves counts unchanged', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
            ]);
            vi.mocked(m.updateReaction).mockResolvedValue({ id: 5, emote: '👍' });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const thumbsUp = container.querySelectorAll('.emote-btn')[0] as HTMLButtonElement;
            thumbsUp.click();

            await vi.waitFor(() => {
                const summary = container.querySelector('.reactions-summary');
                expect(summary?.textContent).toBe('👍 1');
            });
        });
    });

    describe('click handler - API response edge cases', () => {
        it('fallback: uses button emote when API returns null', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
            ]);
            vi.mocked(m.updateReaction).mockResolvedValue(null);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const heartButton = container.querySelectorAll('.emote-btn')[2] as HTMLButtonElement;
            heartButton.click();

            await vi.waitFor(() => {
                expect(m.updateReaction).toHaveBeenCalledWith('owner', 'project', 5, '❤️');
            });
        });

        it('keeps existing myReactionId when API returns null on update', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
            ]);
            vi.mocked(m.updateReaction).mockResolvedValueOnce(null);

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const heartButton = container.querySelectorAll('.emote-btn')[2] as HTMLButtonElement;
            heartButton.click();

            await vi.waitFor(() => {
                expect(m.updateReaction).toHaveBeenCalledTimes(1);
            });

            // Click a different emote - should still use myReactionId=5
            vi.mocked(m.updateReaction).mockResolvedValueOnce({ id: 6, emote: '🚀' });
            const rocketButton = container.querySelectorAll('.emote-btn')[5] as HTMLButtonElement;
            rocketButton.click();

            await vi.waitFor(() => {
                expect(m.updateReaction).toHaveBeenCalledWith('owner', 'project', 5, '🚀');
            });
        });
    });

    describe('click handler - error handling', () => {
        it('shows toast when addReaction fails', async () => {
            const m = await api();
            const t = await toast();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);
            vi.mocked(m.addReaction).mockRejectedValue(new Error('API error'));

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelector('.emote-btn') as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(t.showToast).toHaveBeenCalledWith('Failed to react', 'error');
            });
        });

        it('shows toast when updateReaction fails', async () => {
            const m = await api();
            const t = await toast();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([
                { id: 5, emote: '👍', userName: 'testuser' },
            ]);
            vi.mocked(m.updateReaction).mockRejectedValue(new Error('API error'));

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelectorAll('.emote-btn')[1] as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(t.showToast).toHaveBeenCalledWith('Failed to react', 'error');
            });
        });
    });

    describe('scroll position preservation', () => {
        it('restores scroll position after reaction click', async () => {
            const m = await api();
            const a = await auth();
            vi.mocked(a.getUsername).mockReturnValue('testuser');
            vi.mocked(m.getReactions).mockResolvedValue([]);
            vi.mocked(m.addReaction).mockResolvedValue({ id: 1, emote: '🎉' });
            Object.defineProperty(window, 'scrollY', { value: 150, writable: true, configurable: true });

            const loadReactions = await load();
            const container = document.createElement('div');
            loadReactions(container, 'Promise', '1', 'owner', 'project', { permission: 'Comment' });

            await vi.waitFor(() => {
                expect(m.getReactions).toHaveBeenCalled();
            });

            const button = container.querySelector('.emote-btn') as HTMLButtonElement;
            button.click();

            await vi.waitFor(() => {
                expect(window.scrollTo).toHaveBeenCalledWith(0, 150);
            });
        });
    });
});
