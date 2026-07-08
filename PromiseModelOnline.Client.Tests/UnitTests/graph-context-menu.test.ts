import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
    (globalThis as Record<string, unknown>).tippy = vi.fn().mockReturnValue({
        show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn(),
    });
});

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({ ensureModal: vi.fn(), createConfirmationPromise: vi.fn().mockResolvedValue(true) }));

describe('buildMenuActions', () => {
    let buildMenuActions: (...args: unknown[]) => Array<{ id: string; label: string; danger: boolean; disabled?: boolean; disabledReason?: string }>;
    const callbacks = {
        onGraphMutated: vi.fn(),
        onProjectDeleted: vi.fn(),
        closeMenus: vi.fn(),
        openCreateForm: vi.fn(),
        openMomentStatusForm: vi.fn(),
        isNodeChildrenHidden: vi.fn(),
        setNodeChildrenHidden: vi.fn(),
        revealNextLevel: vi.fn(),
    };

    function nodeData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
        return { nodeType: 'promise', payload: { id: 1, statement: 'Test' }, childCount: 0, ...overrides };
    }

    function build(nd: Record<string, unknown>, hasEditPerm = true) {
        const permissionArg = hasEditPerm ? { permission: 'Edit' } : undefined;
        return buildMenuActions(
            nd, 'owner', 'project',
            callbacks.onGraphMutated,
            callbacks.onProjectDeleted,
            callbacks.closeMenus,
            callbacks.openCreateForm,
            callbacks.openMomentStatusForm,
            callbacks.isNodeChildrenHidden,
            callbacks.setNodeChildrenHidden,
            callbacks.revealNextLevel,
            permissionArg,
        ) as Array<{ id: string; label: string; danger: boolean; disabled?: boolean; disabledReason?: string }>;
    }

    beforeAll(async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        buildMenuActions = mod.buildMenuActions;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('root node includes Create New Promise and Delete', () => {
        const actions = build(nodeData({ nodeType: 'root' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Create New Promise');
        expect(labels).toContain('Delete');
    });

    it('promise node includes Create New Epic', () => {
        const actions = build(nodeData({ nodeType: 'promise' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Create New Epic');
    });

    it('epic node includes Create New Journey', () => {
        const actions = build(nodeData({ nodeType: 'epic' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Create New Journey');
    });

    it('journey node includes Create New Flow', () => {
        const actions = build(nodeData({ nodeType: 'journey' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Create New Flow');
    });

    it('flow node includes Create New Moment', () => {
        const actions = build(nodeData({ nodeType: 'flow' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Create New Moment');
    });

    it('moment node includes Change Status but no Create New', () => {
        const actions = build(nodeData({ nodeType: 'moment' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Change Status');
        expect(labels).not.toContain('Create New');
    });

    it('delete action has danger flag', () => {
        const actions = build(nodeData({ nodeType: 'promise' }));
        const deleteAction = actions.find(a => a.id === 'delete');
        expect(deleteAction?.danger).toBe(true);
    });

    it('promise node always includes Delete', () => {
        const actions = build(nodeData({ nodeType: 'promise' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Delete');
    });

    it('moment node always includes Delete', () => {
        const actions = build(nodeData({ nodeType: 'moment' }));
        const labels = actions.map(a => a.label);
        expect(labels).toContain('Delete');
    });

    describe('permission gating', () => {
        it('create and delete are disabled when no permission', () => {
            const actions = build(nodeData({ nodeType: 'promise' }), false);
            for (const action of actions) {
                if (action.id === 'delete' || action.id === 'create-child') {
                    expect(action.disabled).toBe(true);
                    expect(action.disabledReason).toBe('Requires Edit permission.');
                }
            }
        });

        it('change status is disabled when no permission', () => {
            const actions = build(nodeData({ nodeType: 'moment' }), false);
            const statusAction = actions.find(a => a.id === 'change-status');
            expect(statusAction?.disabled).toBe(true);
            expect(statusAction?.disabledReason).toBe('Requires Edit permission.');
        });
    });

    describe('children toggle actions', () => {
        it('shows Hide Children when children exist', () => {
            const actions = build(nodeData({ nodeType: 'promise', childCount: 3 }));
            const labels = actions.map(a => a.label);
            expect(labels).toContain('Hide Children');
        });

        it('shows Reveal Children when children are hidden', () => {
            callbacks.isNodeChildrenHidden.mockReturnValue(true);
            const actions = build(nodeData({ nodeType: 'promise', childCount: 3 }));
            const labels = actions.map(a => a.label);
            expect(labels).toContain('Reveal Children');
        });

        it('shows Reveal Next Level when children are hidden with descendants', () => {
            callbacks.isNodeChildrenHidden.mockReturnValue(true);
            const actions = build(nodeData({ nodeType: 'promise', childCount: 3, _hiddenDescendantCount: 5 }));
            const labels = actions.map(a => a.label);
            expect(labels).toContain('Reveal Next Level');
        });
    });
});
