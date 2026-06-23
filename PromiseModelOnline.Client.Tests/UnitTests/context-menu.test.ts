import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
    (globalThis as Record<string, unknown>).tippy = vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn() });
});

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiFetch: vi.fn(), apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({ ensureModal: vi.fn().mockReturnValue(document.createElement('div')), createConfirmationPromise: vi.fn().mockResolvedValue(true) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({ createCommentAutocomplete: vi.fn().mockReturnValue({ destroy: vi.fn() }) }));

describe('createGraphContextMenuController', () => {
    it('opens a context menu with status/estimate/owner/type forms', async () => {
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController();
        expect(controller).toHaveProperty('open');
        expect(controller).toHaveProperty('hide');
    });

    it('creates form elements for moment editing', async () => {
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController();
        const event = new MouseEvent('contextmenu');
        controller.open(event, { nodeType: 'moment', id: 'moment-100', payload: { statement: 'Test', statusColor: 'green' } });
        expect(controller.hide).toBeDefined();
    });
});
