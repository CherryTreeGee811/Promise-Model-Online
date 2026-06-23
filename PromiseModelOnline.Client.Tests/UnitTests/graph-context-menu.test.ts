import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
    (globalThis as Record<string, unknown>).tippy = vi.fn().mockReturnValue({
        show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn(),
    });
});

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({ ensureModal: vi.fn(), createConfirmationPromise: vi.fn().mockResolvedValue(true) }));

describe('createGraphContextMenuController', () => {
    it('returns a controller object with expected methods', async () => {
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController();
        expect(controller).toHaveProperty('open');
        expect(controller).toHaveProperty('hide');
    });
});
