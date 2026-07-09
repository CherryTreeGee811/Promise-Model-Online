import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockApiFetch = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({
    apiFetch: mockApiFetch,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    updateMomentStatus: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({
    ensureModal: vi.fn(),
    createConfirmationPromise: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({
    createCommentAutocomplete: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts', () => ({
    STATUS_OPTIONS: [
        { value: 'Todo', label: 'Todo', icon: '\u{1F534}' },
        { value: 'InProgress', label: 'In Progress', icon: '\u{1F7E0}' },
        { value: 'Blocked', label: 'Blocked', icon: '\u{26AB}\u{FE0F}' },
        { value: 'Done', label: 'Done', icon: '\u{1F7E2}' },
    ],
}));

beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
        setProps: vi.fn(),
        setContent: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        destroy: vi.fn(),
    }));
});

afterEach(() => {
    delete (globalThis as Record<string, unknown>).tippy;
});

describe('requestJson', () => {
    it('returns JSON for ok response', async () => {
        // Arrange
        mockApiFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: 'ok' }),
        });
        const { requestJson } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const result = await requestJson('/api/test', { method: 'GET' });

        // Assert
        expect(result).toEqual({ data: 'ok' });
    });

    it('returns undefined for 204 response', async () => {
        // Arrange
        mockApiFetch.mockResolvedValue({
            ok: true,
            status: 204,
        });
        const { requestJson } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const result = await requestJson('/api/test', { method: 'DELETE' });

        // Assert
        expect(result).toBeUndefined();
    });

    it('throws on error response', async () => {
        // Arrange
        mockApiFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'Server error' }),
        });
        const { requestJson } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act & Assert
        await expect(requestJson('/api/test', { method: 'GET' })).rejects.toThrow('Server error');
    });

    it('throws with status text when body lacks message', async () => {
        // Arrange
        mockApiFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
        });
        const { requestJson } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act & Assert
        await expect(requestJson('/api/test', { method: 'GET' })).rejects.toThrow('HTTP error! status: 500');
    });
});

describe('buildMenuActions', () => {
    it('includes create-child action for node with child label', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 0 },
            'owner', 'project',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'create-child')?.label).toBe('Create New Epic');
    });

    it('includes create-child for root node', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'root', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'create-child')?.label).toBe('Create New Promise');
    });

    it('omits create-child for moment nodes', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'moment', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'create-child')).toBeUndefined();
    });

    it('disables create-child without edit permission', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'View' },
        );

        // Assert
        const createAction = actions.find(a => a.id === 'create-child')!;
        expect(createAction.disabled).toBe(true);
        expect(createAction.disabledReason).toBe('Requires Edit permission.');
    });

    it('includes hide-children action when children exist and visible', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 3 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => false, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'hide-children')).toBeDefined();
        expect(actions.find(a => a.id === 'reveal-children')).toBeUndefined();
    });

    it('includes reveal-children when children are hidden', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 3, _hiddenDescendantCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => true, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'reveal-children')).toBeDefined();
        expect(actions.find(a => a.id === 'hide-children')).toBeUndefined();
    });

    it('includes reveal-next-level when children hidden with hidden descendants', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 3, _hiddenDescendantCount: 5 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => true, undefined, vi.fn(),
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'reveal-next-level')).toBeDefined();
    });

    it('omits hide/reveal when no children or hidden descendants', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 0, _hiddenDescendantCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'hide-children')).toBeUndefined();
        expect(actions.find(a => a.id === 'reveal-children')).toBeUndefined();
        expect(actions.find(a => a.id === 'reveal-next-level')).toBeUndefined();
    });

    it('includes change-status for moment nodes', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'moment', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'change-status')).toBeDefined();
    });

    it('omits change-status for non-moment nodes', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'epic', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        expect(actions.find(a => a.id === 'change-status')).toBeUndefined();
    });

    it('disables change-status without Edit permission', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'moment', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'View' },
        );

        // Assert
        const statusAction = actions.find(a => a.id === 'change-status')!;
        expect(statusAction.disabled).toBe(true);
    });

    it('includes delete action for all node types', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'flow', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );

        // Assert
        const deleteAction = actions.find(a => a.id === 'delete')!;
        expect(deleteAction.danger).toBe(true);
        expect(deleteAction.label).toBe('Delete');
    });

    it('disables delete without Edit permission', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'journey', childCount: 0 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'View' },
        );

        // Assert
        const deleteAction = actions.find(a => a.id === 'delete')!;
        expect(deleteAction.disabled).toBe(true);
    });

    it('create-child handler calls openCreateForm', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const openCreateForm = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 0 },
            'owner-slug', 'project-slug',
            undefined, undefined,
            vi.fn(), openCreateForm, vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'create-child')!.handler();

        // Assert
        expect(openCreateForm).toHaveBeenCalledWith(
            { nodeType: 'promise', childCount: 0 },
            'owner-slug', 'project-slug',
            undefined,
        );
    });

    it('hide-children handler calls setNodeChildrenHidden', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const setNodeChildrenHidden = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 3 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => false, setNodeChildrenHidden, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'hide-children')!.handler();

        // Assert
        expect(setNodeChildrenHidden).toHaveBeenCalledWith(
            { nodeType: 'promise', childCount: 3 },
            true,
        );
    });

    it('reveal-next-level handler calls revealNextLevel', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const revealNextLevel = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 3, _hiddenDescendantCount: 5 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => true, undefined, revealNextLevel,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'reveal-next-level')!.handler();

        // Assert
        expect(revealNextLevel).toHaveBeenCalledWith(
            { nodeType: 'promise', childCount: 3, _hiddenDescendantCount: 5 },
        );
    });

    it('change-status handler calls openMomentStatusForm', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const openMomentStatusForm = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'moment', childCount: 0 },
            'o', 'p',
            'onGraphMutated',
            undefined,
            vi.fn(), vi.fn(), openMomentStatusForm,
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'change-status')!.handler();

        // Assert
        expect(openMomentStatusForm).toHaveBeenCalledWith(
            { nodeType: 'moment', childCount: 0 },
            'onGraphMutated',
        );
    });

    it('delete handler for non-root node calls requestJson and onGraphMutated', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', payload: { id: 42 }, childCount: 0 },
            '', '',
            onGraphMutated, undefined,
            closeMenus, vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(closeMenus).toHaveBeenCalled();
        expect(mockApiFetch).toHaveBeenCalled();
        expect(onGraphMutated).toHaveBeenCalled();
    });

    it('delete handler for root node calls requestJson and onProjectDeleted', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const onProjectDeleted = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'root', childCount: 0 },
            '', '',
            undefined, onProjectDeleted,
            closeMenus, vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(closeMenus).toHaveBeenCalled();
        expect(mockApiFetch).toHaveBeenCalled();
        expect(onProjectDeleted).toHaveBeenCalled();
    });

    it('delete handler returns early when not confirmed', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const onGraphMutated = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', payload: { id: 42 }, childCount: 0 },
            '', '',
            onGraphMutated, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).not.toHaveBeenCalled();
        expect(onGraphMutated).not.toHaveBeenCalled();
    });

    it('delete handler for epic node calls requestJson with epic route', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'epic', payload: { id: 42 }, childCount: 0 },
            'owner-slug', 'project-slug',
            vi.fn(), undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).toHaveBeenCalled();
    });

    it('delete handler for journey node calls requestJson', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'journey', payload: { id: 42 }, childCount: 0 },
            'o', 'p',
            vi.fn(), undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).toHaveBeenCalled();
    });

    it('delete handler for flow node calls requestJson', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'flow', payload: { id: 42 }, childCount: 0 },
            'o', 'p',
            vi.fn(), undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).toHaveBeenCalled();
    });

    it('delete handler for moment node calls requestJson', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'moment', payload: { id: 42 }, childCount: 0 },
            'o', 'p',
            vi.fn(), undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).toHaveBeenCalled();
    });

    it('delete handler returns early when route cannot be determined', async () => {
        // Arrange
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const onGraphMutated = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'unknown-type', payload: { id: 42 }, childCount: 0 },
            'o', 'p',
            onGraphMutated, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(mockApiFetch).not.toHaveBeenCalled();
        expect(onGraphMutated).not.toHaveBeenCalled();
    });

    it('delete handler uses modal confirmation when modal element exists', async () => {
        // Arrange
        const htmlMod = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts');
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = '<div class="modal-header"><h5 id="graph-delete-confirmation-modal-title">Delete item</h5></div><div class="modal-body" id="graph-delete-confirmation-modal-body"></div><div class="modal-footer"><button id="graph-delete-confirmation-confirm">Delete</button></div>';
        vi.mocked(htmlMod.ensureModal).mockReturnValue(modalDiv);
        vi.mocked(htmlMod.createConfirmationPromise).mockResolvedValue(true);
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const onProjectDeleted = vi.fn();

        // Act
        const actions = buildMenuActions(
            { nodeType: 'root', childCount: 0 },
            'o', 'p',
            undefined, onProjectDeleted,
            vi.fn(), vi.fn(), vi.fn(),
            undefined, undefined, undefined,
            { permission: 'Edit' },
        );
        await actions.find(a => a.id === 'delete')!.handler();

        // Assert
        expect(htmlMod.ensureModal).toHaveBeenCalled();
        expect(htmlMod.createConfirmationPromise).toHaveBeenCalled();
        expect(mockApiFetch).toHaveBeenCalled();
        expect(onProjectDeleted).toHaveBeenCalled();
    });

    it('action order is consistent', async () => {
        // Arrange
        const { buildMenuActions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const actions = buildMenuActions(
            { nodeType: 'promise', childCount: 2, _hiddenDescendantCount: 3 },
            'o', 'p',
            undefined, undefined,
            vi.fn(), vi.fn(), vi.fn(),
            () => true, undefined, vi.fn(),
            { permission: 'Edit' },
        );

        // Assert
        expect(actions[0].id).toBe('create-child');
        expect(actions[1].id).toBe('reveal-children');
        expect(actions[2].id).toBe('reveal-next-level');
        expect(actions[3].id).toBe('delete');
    });
});

describe('buildMomentFormElement', () => {
    it('returns undefined for moment node type', async () => {
        // Arrange
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const result = buildMomentFormElement(
            { nodeType: 'moment', childCount: 0 },
            '', '',
            undefined, undefined, vi.fn(),
        );

        // Assert
        expect(result).toBeUndefined();
    });

    it('returns form element for flow node type', async () => {
        // Arrange
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            () => [{ id: 1, name: 'Sprint 1' }],
            undefined, vi.fn(),
        );

        // Assert
        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form!.className).toContain('graph-context-menu-form');
    });

    it('builds form with all moment fields', async () => {
        // Arrange
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            () => [{ id: 1, name: 'Sprint 1' }],
            undefined, vi.fn(),
        )!;

        // Assert
        expect(form.querySelector('[name="statement"]')).toBeTruthy();
        expect(form.querySelector('[name="description"]')).toBeTruthy();
        expect(form.querySelector('[name="type"]')).toBeTruthy();
        expect(form.querySelector('[name="status"]')).toBeTruthy();
        expect(form.querySelector('[name="effortEstimate"]')).toBeTruthy();
        expect(form.querySelector('[name="assignedStrideId"]')).toBeTruthy();
    });

    it('submit handler calls requestJson and triggers callbacks', async () => {
        // Arrange
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            undefined,
            onGraphMutated, closeMenus,
        )!;

        const statementInput = form.querySelector('[name="statement"]') as HTMLInputElement;
        statementInput.value = 'Test Moment';

        // Act
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Wait for async handler
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        expect(mockApiFetch).toHaveBeenCalled();
        expect(closeMenus).toHaveBeenCalled();
        expect(onGraphMutated).toHaveBeenCalled();
    });

    it('returns early when statement is empty', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();

        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            undefined,
            undefined, closeMenus,
        )!;

        const statementInput = form.querySelector('[name="statement"]') as HTMLInputElement;
        statementInput.value = '   ';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('submit sends effortEstimate and assignedStrideId when selected', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();

        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 2, payload: { id: 42 } },
            '', '',
            () => [{ id: 10, name: 'Sprint Alpha' }],
            undefined, closeMenus,
        )!;

        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'Test';
        (form.querySelector('[name="effortEstimate"]') as HTMLSelectElement).value = 'M';
        (form.querySelector('[name="assignedStrideId"]') as HTMLSelectElement).value = '10';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).toHaveBeenCalled();
        const callBody = JSON.parse(mockApiFetch.mock.calls[0][1].body);
        expect(callBody.effortEstimate).toBe('M');
        expect(callBody.assignedStrideId).toBe(10);
        expect(callBody.displayOrder).toBe(3);
    });

    it('submit sends undefined effortEstimate when dash selected', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();

        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            undefined,
            undefined, closeMenus,
        )!;

        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'Test';
        (form.querySelector('[name="effortEstimate"]') as HTMLSelectElement).value = '-';
        (form.querySelector('[name="assignedStrideId"]') as HTMLSelectElement).value = '';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        const callBody = JSON.parse(mockApiFetch.mock.calls[0][1].body);
        expect(callBody.effortEstimate).toBeUndefined();
        expect(callBody.assignedStrideId).toBeUndefined();
    });

    it('submit handler re-enables button on api error', async () => {
        mockApiFetch.mockRejectedValue(new Error('API Error'));
        const { buildMomentFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        const form = buildMomentFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '',
            undefined,
            onGraphMutated, closeMenus,
        )!;

        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'Test Moment';

        const rejectionHandler = vi.fn();
        process.on('unhandledRejection', rejectionHandler);

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 50));

        process.removeListener('unhandledRejection', rejectionHandler);

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(false);
        expect(submitBtn.textContent).toBe('Create Moment');
    });
});

describe('createGraphContextMenuController', () => {
    it('returns controller with hide, destroy, open methods', async () => {
        // Arrange
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');

        // Act
        const controller = createGraphContextMenuController({});

        // Assert
        expect(controller).toHaveProperty('hide');
        expect(controller).toHaveProperty('destroy');
        expect(controller).toHaveProperty('open');
        expect(typeof controller.hide).toBe('function');
        expect(typeof controller.destroy).toBe('function');
        expect(typeof controller.open).toBe('function');
    });

    it('hide calls tippy hide on both instances', async () => {
        // Arrange
        const hideForm = vi.fn();
        const hideInstance = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: vi.fn(),
            setContent: vi.fn(),
            show: vi.fn(),
            hide: hideInstance,
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({});

        // Act
        controller.hide();

        // Assert
        expect(hideInstance).toHaveBeenCalled();
    });

    it('destroy calls tippy destroy on both instances', async () => {
        // Arrange
        const destroyForm = vi.fn();
        const destroyInstance = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: vi.fn(),
            setContent: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            destroy: destroyInstance,
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({});

        // Act
        controller.destroy();

        // Assert
        expect(destroyInstance).toHaveBeenCalled();
    });

    it('open method shows tippy with built menu actions', async () => {
        const showFn = vi.fn();
        const setPropsFn = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: setPropsFn,
            setContent: vi.fn(),
            show: showFn,
            hide: vi.fn(),
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
        });
        const event = new MouseEvent('contextmenu', { clientX: 100, clientY: 200 });

        controller.open(event, { nodeType: 'flow', childCount: 0, payload: { id: 42 } });

        expect(showFn).toHaveBeenCalled();
    });

    it('open creates menu with buildMenuActions and buildMenuElement', async () => {
        const showFn = vi.fn();
        const setContentFn = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: vi.fn(),
            setContent: setContentFn,
            show: showFn,
            hide: vi.fn(),
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
            isNodeChildrenHidden: () => false,
            setNodeChildrenHidden: vi.fn(),
            revealNextLevel: vi.fn(),
            onGraphMutated: vi.fn(),
        });
        const event = new MouseEvent('contextmenu', { clientX: 50, clientY: 75 });

        controller.open(event, { nodeType: 'promise', childCount: 3, payload: { id: 99 } });

        expect(showFn).toHaveBeenCalled();
    });

    it('open handles missing event properties', async () => {
        const showFn = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: vi.fn(),
            setContent: vi.fn(),
            show: showFn,
            hide: vi.fn(),
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
        });

        controller.open(undefined as unknown as MouseEvent, { nodeType: 'flow', childCount: 0 });

        expect(showFn).toHaveBeenCalled();
    });

    it('tippy receives onHidden callback for formTippy', async () => {
        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        expect(tippyOptsList.length).toBe(2);
        expect(typeof tippyOptsList[0].onHidden).toBe('function');
        expect(typeof tippyOptsList[1].onHidden).toBe('function');
    });

    it('appendTarget returns body when no fullscreen viewport', async () => {
        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        const appendToFn = tippyOptsList[0].appendTo as () => HTMLElement;
        const target = appendToFn();
        expect(target).toBe(document.body);
    });

    it('appendTarget returns viewport when it is fullscreen element', async () => {
        const viewport = document.createElement('div');
        viewport.id = 'graph-viewport';
        document.body.append(viewport);
        Object.defineProperty(document, 'fullscreenElement', { value: viewport, configurable: true });

        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        const appendToFn = tippyOptsList[0].appendTo as () => HTMLElement;
        const target = appendToFn();
        expect(target).toBe(viewport);

        viewport.remove();
        Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    });

    it('formTippy onHidden resets its content', async () => {
        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        const onHidden = tippyOptsList[0].onHidden as (instance: { setContent: (c: HTMLElement) => void }) => void;
        const setContentMock = vi.fn();
        onHidden({ setContent: setContentMock });
        expect(setContentMock).toHaveBeenCalled();
    });

    it('instance onHidden clears menuContent children', async () => {
        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        const onHidden = tippyOptsList[1].onHidden as () => void;
        onHidden();
    });

    it('instance getReferenceClientRect returns referenceRect', async () => {
        const tippyOptsList: Array<Record<string, unknown>> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            tippyOptsList.push(opts);
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({});

        const getRect = tippyOptsList[1].getReferenceClientRect as () => DOMRect;
        const rect = getRect();
        expect(rect).toBeInstanceOf(DOMRect);
        expect(rect.width).toBe(0);
    });

    it('hide method of controller calls tippy hide', async () => {
        const formHide = vi.fn();
        const instanceHide = vi.fn();
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: vi.fn(),
            setContent: vi.fn(),
            show: vi.fn(),
            hide: instanceHide,
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({});
        controller.hide();
        expect(instanceHide).toHaveBeenCalled();
    });

    it('clicking create-child in menu triggers openCreateForm and openForm', async () => {
        let capturedContent: HTMLElement | undefined;
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            if (opts.content instanceof HTMLElement) {
                capturedContent = opts.content;
            }
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
        });

        controller.open(new MouseEvent('contextmenu', { clientX: 100, clientY: 100 }), { nodeType: 'flow', childCount: 0, payload: { id: 1 } });

        expect(capturedContent).toBeDefined();
        const createBtn = capturedContent!.querySelector('button')!;
        expect(createBtn.textContent).toBe('Create New Moment');
        createBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('clicking change-status in menu triggers openMomentStatusForm and openForm', async () => {
        const momentApi = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts');
        vi.mocked(momentApi.updateMomentStatus).mockResolvedValue(undefined);
        let capturedContent: HTMLElement | undefined;
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            if (opts.content instanceof HTMLElement) {
                capturedContent = opts.content;
            }
            return {
                setProps: vi.fn(),
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
        });

        controller.open(new MouseEvent('contextmenu', { clientX: 100, clientY: 100 }), { nodeType: 'moment', childCount: 0, payload: { id: 1, sequenceNumber: 5 } });

        expect(capturedContent).toBeDefined();
        const statusBtn = Array.from(capturedContent!.querySelectorAll('button')).find(b => b.textContent === 'Change Status')!;
        expect(statusBtn).toBeDefined();
        statusBtn.click();
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('clicking change-status with null sequenceNumber returns early in openForm', async () => {
        let capturedContent: HTMLElement | undefined;
        const setPropsCalls: Array<vi.Mock> = [];
        (globalThis as Record<string, unknown>).tippy = vi.fn((_ref: unknown, opts: Record<string, unknown>) => {
            if (opts.content instanceof HTMLElement) {
                capturedContent = opts.content;
            }
            const setProps = vi.fn();
            setPropsCalls.push(setProps);
            return {
                setProps,
                setContent: vi.fn(),
                show: vi.fn(),
                hide: vi.fn(),
                destroy: vi.fn(),
            };
        });
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({
            owner: 'o', project: 'p',
            permission: { permission: 'Edit' },
        });

        controller.open(new MouseEvent('contextmenu', { clientX: 100, clientY: 100 }), { nodeType: 'moment', childCount: 0, payload: { id: 1, sequenceNumber: null } });

        const statusBtn = Array.from(capturedContent!.querySelectorAll('button')).find(b => b.textContent === 'Change Status')!;
        statusBtn.click();
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(setPropsCalls[0]).not.toHaveBeenCalled();
    });

    it('setProps getReferenceClientRect invokes arrow function', async () => {
        let capturedSetProps: ((props: { getReferenceClientRect?: () => DOMRect }) => void) | undefined;
        const instanceSetProps = vi.fn((props: Record<string, unknown>) => {
            if (props.getReferenceClientRect) {
                (props.getReferenceClientRect as () => DOMRect)();
            }
        });
        (globalThis as Record<string, unknown>).tippy = vi.fn(() => ({
            setProps: instanceSetProps,
            setContent: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            destroy: vi.fn(),
        }));
        const { createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const controller = createGraphContextMenuController({ owner: 'o', project: 'p' });

        controller.open(new MouseEvent('contextmenu', { clientX: 50, clientY: 50 }), { nodeType: 'flow', childCount: 0 });
        expect(instanceSetProps).toHaveBeenCalled();
    });
});

describe('getCreateActionMeta', () => {
    it('returns Promise metadata for root', async () => {
        const { createGraphContextMenuController, getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'test-owner', project: 'test-project' });
        const result = getCreateActionMeta({ nodeType: 'root' });
        expect(result).toEqual({
            entityLabel: 'Promise',
            endpoint: '/api/projects/test-owner/test-project/promises/create',
            parentField: 'projectId',
        });
    });

    it('returns Epic metadata for promise', async () => {
        const { getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateActionMeta({ nodeType: 'promise' });
        expect(result).toEqual({
            entityLabel: 'Epic',
            endpoint: '/api/projects/test-owner/test-project/epics/create',
            parentField: 'productPromiseId',
        });
    });

    it('returns Journey metadata for epic', async () => {
        const { getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateActionMeta({ nodeType: 'epic' });
        expect(result).toEqual({
            entityLabel: 'Journey',
            endpoint: '/api/projects/test-owner/test-project/journeys/create',
            parentField: 'epicId',
        });
    });

    it('returns Flow metadata for journey', async () => {
        const { getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateActionMeta({ nodeType: 'journey' });
        expect(result).toEqual({
            entityLabel: 'Flow',
            endpoint: '/api/projects/test-owner/test-project/flows/create',
            parentField: 'journeyId',
        });
    });

    it('returns Moment metadata for flow', async () => {
        const { getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateActionMeta({ nodeType: 'flow' });
        expect(result).toEqual({
            entityLabel: 'Moment',
            endpoint: '/api/projects/test-owner/test-project/moments/create',
            parentField: 'flowId',
        });
    });

    it('returns undefined for unknown node type', async () => {
        const { getCreateActionMeta } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateActionMeta({ nodeType: 'unknown' });
        expect(result).toBeUndefined();
    });
});

describe('getCreateFormDefaults', () => {
    it('returns defaults for root', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'root', childCount: 0 });
        expect(result).toEqual({ statement: 'New Promise', description: '', displayOrder: 1 });
    });

    it('returns defaults for promise', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'promise', childCount: 2 });
        expect(result).toEqual({ statement: 'New Epic', description: '', displayOrder: 3 });
    });

    it('returns defaults for epic', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'epic', childCount: 5 });
        expect(result).toEqual({ statement: 'New Journey', description: '', displayOrder: 6 });
    });

    it('returns defaults for journey', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'journey', childCount: 1 });
        expect(result).toEqual({ statement: 'New Flow', description: '', displayOrder: 2 });
    });

    it('returns defaults for flow', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'flow', childCount: 3 });
        expect(result).toEqual({ statement: 'New Moment', description: '', displayOrder: 4 });
    });

    it('uses 0 for null childCount', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'flow', childCount: null });
        expect(result).toEqual({ statement: 'New Moment', description: '', displayOrder: 1 });
    });

    it('returns undefined for unknown node type', async () => {
        const { getCreateFormDefaults } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getCreateFormDefaults({ nodeType: 'unknown' });
        expect(result).toBeUndefined();
    });
});

describe('createInputField', () => {
    it('creates text input field by default', async () => {
        const { createInputField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const { field, input } = createInputField({ name: 'test', label: 'Test Label' });
        expect(field).toBeInstanceOf(HTMLLabelElement);
        expect(input).toBeInstanceOf(HTMLInputElement);
        expect((input as HTMLInputElement).type).toBe('text');
        expect(input.name).toBe('test');
        expect(field.className).toBe('graph-context-menu-form__field');
    });

    it('creates textarea field', async () => {
        const { createInputField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const { field, input } = createInputField({ name: 'desc', label: 'Desc', type: 'textarea', rows: 5, value: 'val', placeholder: 'ph' });
        expect(input).toBeInstanceOf(HTMLTextAreaElement);
        expect((input as HTMLTextAreaElement).rows).toBe(5);
        expect(input.value).toBe('val');
        expect(input.placeholder).toBe('ph');
    });

    it('applies custom value and placeholder', async () => {
        const { createInputField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const { input } = createInputField({ name: 'n', label: 'L', value: 'initial', placeholder: 'enter here' });
        expect(input.value).toBe('initial');
        expect(input.placeholder).toBe('enter here');
    });
});

describe('createSelectField', () => {
    it('creates select with options', async () => {
        const { createSelectField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }];
        const { field, select } = createSelectField({ name: 'sel', label: 'Select', options });
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(select.options.length).toBe(2);
        expect(select.options[0].textContent).toBe('Option A');
        expect(select.name).toBe('sel');
    });

    it('preselects matching option', async () => {
        const { createSelectField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }];
        const { select } = createSelectField({ name: 's', label: 'S', value: 'y', options });
        expect(select.options[1].selected).toBe(true);
    });

    it('handles empty options', async () => {
        const { createSelectField } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const { select } = createSelectField({ name: 'e', label: 'E' });
        expect(select.options.length).toBe(0);
    });
});

describe('getMomentTypeOptions', () => {
    it('returns Story and Job options', async () => {
        const { getMomentTypeOptions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = getMomentTypeOptions();
        expect(options).toEqual([
            { value: 'Story', label: 'Story' },
            { value: 'Job', label: 'Job' },
        ]);
    });
});

describe('getMomentStatusValue', () => {
    it('returns canonical status from payload.status', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { status: 'Done' } });
        expect(result).toBe('Done');
    });

    it('returns canonical status from payload.Status (capitalized)', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { Status: 'inprogress' } });
        expect(result).toBe('InProgress');
    });

    it('maps statusColor green to Done', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'green' } });
        expect(result).toBe('Done');
    });

    it('maps statusColor orange to InProgress', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'orange' } });
        expect(result).toBe('InProgress');
    });

    it('maps statusColor red to Todo', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'red' } });
        expect(result).toBe('Todo');
    });

    it('maps statusColor black to Blocked', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'black' } });
        expect(result).toBe('Blocked');
    });

    it('defaults to Todo for unknown color', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'purple' } });
        expect(result).toBe('Todo');
    });

    it('handles StatusColor with camelCase', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { StatusColor: 'amber' } });
        expect(result).toBe('InProgress');
    });

    it('returns Todo for empty payload', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({});
        expect(result).toBe('Todo');
    });

    it('returns Todo when payload is absent', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ nodeType: 'moment' });
        expect(result).toBe('Todo');
    });

    it('maps statusColor done (lowercase) to Done', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'done' } });
        expect(result).toBe('Done');
    });

    it('maps statusColor blocked to Blocked', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'blocked' } });
        expect(result).toBe('Blocked');
    });

    it('maps statusColor in-progress to InProgress', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'in-progress' } });
        expect(result).toBe('InProgress');
    });

    it('maps statusColor yellow to InProgress', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { statusColor: 'yellow' } });
        expect(result).toBe('InProgress');
    });

    it('prefers payload.status over statusColor', async () => {
        const { getMomentStatusValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = getMomentStatusValue({ payload: { status: 'Blocked', statusColor: 'green' } });
        expect(result).toBe('Blocked');
    });
});

describe('getMomentEstimateOptions', () => {
    it('returns estimate options with dash and sizes', async () => {
        const { getMomentEstimateOptions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = getMomentEstimateOptions();
        expect(options).toEqual([
            { value: '-', label: '-' },
            { value: 'XS', label: 'XS' },
            { value: 'S', label: 'S' },
            { value: 'M', label: 'M' },
            { value: 'L', label: 'L' },
            { value: 'XL', label: 'XL' },
            { value: 'XXL', label: 'XXL' },
            { value: 'XXXL', label: 'XXXL' },
        ]);
    });
});

describe('getStrideOptions', () => {
    it('returns Backlog-only options when no strides', async () => {
        const { getStrideOptions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = getStrideOptions();
        expect(options).toEqual([{ value: '', label: 'Backlog' }]);
    });

    it('includes stride entries with names', async () => {
        const { getStrideOptions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = getStrideOptions([{ id: 1, name: 'Sprint 1' }, { id: 2, name: 'Sprint 2' }]);
        expect(options).toHaveLength(3);
        expect(options[1]).toEqual({ value: '1', label: 'Stride #1 - Sprint 1' });
        expect(options[2]).toEqual({ value: '2', label: 'Stride #2 - Sprint 2' });
    });

    it('includes stride entries without names', async () => {
        const { getStrideOptions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const options = getStrideOptions([{ id: 5 }]);
        expect(options[1]).toEqual({ value: '5', label: 'Stride #5' });
    });
});

describe('createFormActionsBar', () => {
    it('creates cancel and submit buttons', async () => {
        const { createFormActionsBar } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const { cancelButton, submitButton } = createFormActionsBar(closeMenus, 'Submit Me');

        expect(cancelButton.type).toBe('button');
        expect(cancelButton.textContent).toBe('Cancel');
        expect(cancelButton.className).toContain('graph-context-menu-form__button--secondary');
        expect(submitButton.type).toBe('submit');
        expect(submitButton.textContent).toBe('Submit Me');
        expect(submitButton.className).toContain('graph-context-menu-form__button--primary');
    });

    it('cancel button triggers closeMenus on click', async () => {
        const { createFormActionsBar } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const closeMenus = vi.fn();
        const { cancelButton } = createFormActionsBar(closeMenus, 'Submit');

        cancelButton.click();

        expect(closeMenus).toHaveBeenCalled();
    });
});

describe('buildMomentStatusFormElement', () => {
    it('returns undefined when sequenceNumber is null', async () => {
        const { buildMomentStatusFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = buildMomentStatusFormElement(
            { nodeType: 'moment', payload: { sequenceNumber: null } },
            undefined, vi.fn(),
        );
        expect(result).toBeUndefined();
    });

    it('returns form when payload is missing (sequenceNumber is undefined, not null)', async () => {
        const { buildMomentStatusFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = buildMomentStatusFormElement(
            { nodeType: 'moment' },
            undefined, vi.fn(),
        );
        expect(result).toBeInstanceOf(HTMLFormElement);
    });

    it('returns form element with status field', async () => {
        const { buildMomentStatusFormElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const form = buildMomentStatusFormElement(
            { nodeType: 'moment', payload: { sequenceNumber: 42, flowId: 7 } },
            undefined, vi.fn(),
        );
        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form!.querySelector('[name="status"]')).toBeTruthy();
        expect(form!.querySelector('button[type="submit"]')?.textContent).toBe('Save Status');
    });

    it('submit handler calls updateMomentStatus and triggers callbacks', async () => {
        const momentApi = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts');
        vi.mocked(momentApi.updateMomentStatus).mockResolvedValue(undefined);
        const { buildMomentStatusFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        const form = buildMomentStatusFormElement(
            { nodeType: 'moment', payload: { sequenceNumber: 42, flowId: 7 } },
            onGraphMutated, closeMenus,
        )!;

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(momentApi.updateMomentStatus).toHaveBeenCalledWith('o', 'p', 42, 'Todo', 7);
        expect(closeMenus).toHaveBeenCalled();
        expect(onGraphMutated).toHaveBeenCalled();
    });

    it('cancels via cancel button click', async () => {
        const { buildMomentStatusFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildMomentStatusFormElement(
            { nodeType: 'moment', payload: { sequenceNumber: 42 } },
            undefined, closeMenus,
        )!;

        const cancelBtn = form.querySelector('button[type="button"]') as HTMLButtonElement;
        cancelBtn.click();

        expect(closeMenus).toHaveBeenCalled();
    });

    it('submit handler re-enables button on error', async () => {
        const momentApi = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts');
        vi.mocked(momentApi.updateMomentStatus).mockRejectedValue(new Error('Fail'));
        const { buildMomentStatusFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildMomentStatusFormElement(
            { nodeType: 'moment', payload: { sequenceNumber: 42 } },
            undefined, closeMenus,
        )!;

        const rejectionHandler = vi.fn();
        process.on('unhandledRejection', rejectionHandler);

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 50));

        process.removeListener('unhandledRejection', rejectionHandler);

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(false);
        expect(submitBtn.textContent).toBe('Save Status');
    });
});

describe('buildCreateFormElement', () => {
    it('returns undefined for unknown node type', async () => {
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const result = buildCreateFormElement(
            { nodeType: 'unknown' }, '', '', undefined, undefined, vi.fn(),
        );
        expect(result).toBeUndefined();
    });

    it('returns Moment form for flow nodes (delegates to buildMomentFormElement)', async () => {
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const form = buildCreateFormElement(
            { nodeType: 'flow', childCount: 0, payload: { id: 42 } },
            '', '', () => [], undefined, vi.fn(),
        );
        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form!.querySelector('[name="type"]')).toBeTruthy();
    });

    it('returns generic Create form for promise nodes', async () => {
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, undefined, vi.fn(),
        );
        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form!.querySelector('[name="statement"]')).toBeTruthy();
        expect(form!.querySelector('[name="description"]')).toBeTruthy();
        expect(form!.querySelector('button[type="submit"]')?.textContent).toBe('Create Epic');
    });

    it('generic form submit creates entity and triggers callbacks', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, onGraphMutated, closeMenus,
        )!;
        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'New Epic';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).toHaveBeenCalled();
        expect(closeMenus).toHaveBeenCalled();
        expect(onGraphMutated).toHaveBeenCalled();
    });

    it('generic form create for root node includes projectId in endpoint', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'root', childCount: 0 },
            'owner', 'project', undefined, undefined, closeMenus,
        )!;
        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'New Project';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).toHaveBeenCalled();
    });

    it('generic form returns early with empty statement', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, undefined, closeMenus,
        )!;
        (form.querySelector('[name="statement"]') as HTMLInputElement).value = '   ';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('generic form cancel button triggers closeMenus', async () => {
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, undefined, closeMenus,
        )!;

        const cancelBtn = form.querySelector('button[type="button"]') as HTMLButtonElement;
        cancelBtn.click();

        expect(closeMenus).toHaveBeenCalled();
    });

    it('generic form sets parentField for non-root nodes', async () => {
        mockApiFetch.mockResolvedValue({ ok: true, status: 204 });
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, undefined, closeMenus,
        )!;
        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'Test';

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockApiFetch).toHaveBeenCalled();
        const callBody = JSON.parse(mockApiFetch.mock.calls[0][1].body);
        expect(callBody.productPromiseId).toBe(50);
    });

    it('generic form submit re-enables on api error', async () => {
        mockApiFetch.mockRejectedValue(new Error('Network error'));
        const { buildCreateFormElement, createGraphContextMenuController } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        createGraphContextMenuController({ owner: 'o', project: 'p' });
        const closeMenus = vi.fn();
        const onGraphMutated = vi.fn();

        const form = buildCreateFormElement(
            { nodeType: 'promise', childCount: 0, payload: { id: 50 } },
            'owner', 'project', undefined, onGraphMutated, closeMenus,
        )!;
        (form.querySelector('[name="statement"]') as HTMLInputElement).value = 'New Epic';

        const rejectionHandler = vi.fn();
        process.on('unhandledRejection', rejectionHandler);

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 50));

        process.removeListener('unhandledRejection', rejectionHandler);

        expect(mockApiFetch).toHaveBeenCalled();
    });
});

describe('buildMenuElement', () => {
    it('builds menu div with action buttons', async () => {
        const { buildMenuElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const actions = [
            { id: 'a1', label: 'Action 1', danger: false, handler: vi.fn() },
            { id: 'a2', label: 'Action 2', danger: false, handler: vi.fn() },
        ];
        const menu = buildMenuElement(actions);

        expect(menu.className).toBe('graph-context-menu');
        expect(menu.children.length).toBe(2);
        expect((menu.children[0] as HTMLButtonElement).textContent).toBe('Action 1');
    });

    it('adds danger class for dangerous actions', async () => {
        const { buildMenuElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const actions = [
            { id: 'del', label: 'Delete', danger: true, handler: vi.fn() },
        ];
        const menu = buildMenuElement(actions);

        expect((menu.children[0] as HTMLButtonElement).className).toContain('graph-context-menu__item--danger');
    });

    it('disables button for disabled actions', async () => {
        const { buildMenuElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const actions = [
            { id: 'dis', label: 'Disabled', danger: false, disabled: true, disabledReason: 'No permission', handler: vi.fn() },
        ];
        const menu = buildMenuElement(actions);
        const btn = menu.children[0] as HTMLButtonElement;

        expect(btn.disabled).toBe(true);
        expect(btn.className).toContain('graph-context-menu__item--disabled');
        expect(btn.title).toBe('No permission');
    });

    it('click handler calls action.handler and prevents event propagation', async () => {
        const handler = vi.fn().mockResolvedValue(undefined);
        const { buildMenuElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const actions = [
            { id: 'act', label: 'Click Me', danger: false, handler },
        ];
        const menu = buildMenuElement(actions);
        const btn = menu.children[0] as HTMLButtonElement;

        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        btn.dispatchEvent(event);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(handler).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('click handler does nothing for disabled actions', async () => {
        const handler = vi.fn();
        const { buildMenuElement } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const actions = [
            { id: 'dis', label: 'Nope', danger: false, disabled: true, handler },
        ];
        const menu = buildMenuElement(actions);
        const btn = menu.children[0] as HTMLButtonElement;

        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(handler).not.toHaveBeenCalled();
    });
});
