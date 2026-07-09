import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({ patchChildMetrics: vi.fn() }));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts', () => ({
    removeInlineEmptyRow: vi.fn(),
    insertRowBeforeAddRow: vi.fn(),
}));

function createMockConfig(overrides: Record<string, unknown> = {}) {
    return {
        formId: 'add-form',
        inputId: 'statement-input',
        submitButtonId: 'submit-btn',
        msgId: 'form-msg',
        owner: 'test-owner',
        project: 'test-project',
        tbody: document.createElement('tbody'),
        onCreate: vi.fn().mockResolvedValue({ id: 42, name: 'Test' }),
        getRowHtml: vi.fn().mockReturnValue('<tr><td>Test</td></tr>'),
        datasetKey: 'epic',
        childMetricsKey: 'epic-42',
        ...overrides,
    } as const;
}

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
        <div id="test-container">
            <form id="add-form">
                <input id="statement-input" />
                <select id="type-select"><option value="Story">Story</option></select>
                <button id="submit-btn">Add</button>
                <span id="form-msg"></span>
            </form>
        </div>
    `;
});

describe('setupAddChildForm', () => {
    it('returns early when form element is missing', async () => {
        document.body.innerHTML = '';
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        expect(config.onCreate).not.toHaveBeenCalled();
    });

    it('returns early when statement input is missing', async () => {
        document.body.innerHTML = '<form id="add-form"><span id="form-msg"></span><button id="submit-btn">Add</button></form>';
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        expect(config.onCreate).not.toHaveBeenCalled();
    });

    it('returns early when message element is missing', async () => {
        document.body.innerHTML = '<form id="add-form"><input id="statement-input" /><button id="submit-btn">Add</button></form>';
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        expect(config.onCreate).not.toHaveBeenCalled();
    });

    it('returns early when submit button is missing', async () => {
        document.body.innerHTML = '<form id="add-form"><input id="statement-input" /><span id="form-msg"></span></form>';
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        expect(config.onCreate).not.toHaveBeenCalled();
    });

    it('returns early when typeSelectId is specified but element is missing', async () => {
        document.body.innerHTML = '<form id="add-form"><input id="statement-input" /><button id="submit-btn">Add</button><span id="form-msg"></span></form>';
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig({ typeSelectId: 'missing-select' });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        expect(config.onCreate).not.toHaveBeenCalled();
    });

    it('shows validation message when statement is empty', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const msg = document.getElementById('form-msg')!;
        form.dispatchEvent(new Event('submit'));
        expect(msg.textContent).toBe('Statement is required.');
        expect(config.onCreate).not.toHaveBeenCalled();
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(false);
    });

    it('creates entity and inserts row on successful submission', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { removeInlineEmptyRow, insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42, name: 'Test' });
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('New epic', undefined);
        expect(removeInlineEmptyRow).toHaveBeenCalled();
        expect(insertRowBeforeAddRow).toHaveBeenCalled();
        expect(input.value).toBe('');
        expect(patchChildMetrics).toHaveBeenCalledWith('epic-42', [{ id: 42, name: 'Test' }]);
    });

    it('calls onSuccess callback when provided', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const onSuccess = vi.fn();
        const config = createMockConfig({ onSuccess });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(onSuccess).toHaveBeenCalled();
        expect(patchChildMetrics).toHaveBeenCalledTimes(1);
    });

    it('does not call onSuccess when not provided', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig();
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
    });

    it('handles created being null (no row insertion)', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { removeInlineEmptyRow, insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const onCreate = vi.fn().mockResolvedValue(null);
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('New epic', undefined);
        expect(removeInlineEmptyRow).not.toHaveBeenCalled();
        expect(insertRowBeforeAddRow).not.toHaveBeenCalled();
        expect(patchChildMetrics).not.toHaveBeenCalled();
    });

    it('handles tbody being null (no row insertion)', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { removeInlineEmptyRow, insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const config = createMockConfig({ tbody: null, onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalled();
        expect(removeInlineEmptyRow).not.toHaveBeenCalled();
        expect(insertRowBeforeAddRow).not.toHaveBeenCalled();
        expect(patchChildMetrics).not.toHaveBeenCalled();
    });

    it('passes extra from getExtra when provided', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const getExtra = vi.fn().mockReturnValue('Bug');
        const config = createMockConfig({ onCreate, getExtra });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New item';
        await form.dispatchEvent(new Event('submit'));
        expect(getExtra).toHaveBeenCalled();
        expect(onCreate).toHaveBeenCalledWith('New item', 'Bug');
    });

    it('passes only statement when getExtra is not provided', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const config = createMockConfig({ onCreate, getExtra: undefined });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New item';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('New item', undefined);
    });

    it('shows error message when onCreate throws', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockRejectedValue(new Error('API error'));
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const msg = document.getElementById('form-msg')!;
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(msg.textContent).toBe('Failed to add epic.');
        expect(submitBtn.disabled).toBe(false);
    });

    it('re-enables submit button after success', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(submitBtn.disabled).toBe(false);
    });

    it('re-enables submit button after error', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockRejectedValue(new Error('fail'));
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(submitBtn.disabled).toBe(false);
    });

    it('includes items in patchChildMetrics when provided', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const items = [{ id: 1, name: 'Existing' }];
        const onCreate = vi.fn().mockResolvedValue({ id: 2, name: 'New' });
        const config = createMockConfig({ onCreate, items });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'New epic';
        await form.dispatchEvent(new Event('submit'));
        expect(patchChildMetrics).toHaveBeenCalledWith('epic-42', [{ id: 1, name: 'Existing' }, { id: 2, name: 'New' }]);
    });

    it('resets typeSelect value when present', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const config = createMockConfig({ typeSelectId: 'type-select' });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        const typeSelect = document.getElementById('type-select') as HTMLSelectElement;
        typeSelect.value = 'Other';
        input.value = 'New item';
        await form.dispatchEvent(new Event('submit'));
        expect(typeSelect.value).toBe('Story');
    });

    it('trims whitespace from statement input', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const config = createMockConfig({ onCreate });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = '  spaced epic  ';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('spaced epic', undefined);
    });

    it('copies data- attributes from parsed row', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { removeInlineEmptyRow, insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 99 });
        const getRowHtml = vi.fn().mockReturnValue('<tr data-epic-id="99" class="some-class"><td>WithAttr</td></tr>');
        const config = createMockConfig({ onCreate, getRowHtml });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'has data attr';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('has data attr', undefined);
        expect(removeInlineEmptyRow).toHaveBeenCalled();
        expect(insertRowBeforeAddRow).toHaveBeenCalled();
        const insertedRow = (insertRowBeforeAddRow as ReturnType<typeof vi.fn>).mock.calls[0][1] as HTMLElement;
        expect(insertedRow.getAttribute('data-epic-id')).toBe('99');
        expect(insertedRow.getAttribute('class')).toBeNull();
    });

    it('handles getRowHtml returning no tr element (parsedRow null)', async () => {
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const { removeInlineEmptyRow, insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const getRowHtml = vi.fn().mockReturnValue('<div>No tr here</div>');
        const config = createMockConfig({ onCreate, getRowHtml });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'test no tr';
        await form.dispatchEvent(new Event('submit'));
        expect(removeInlineEmptyRow).toHaveBeenCalled();
        expect(insertRowBeforeAddRow).toHaveBeenCalled();
    });

    it('handles parsed row without getAttributeNames (?? [])', async () => {
        const origParseFromString = DOMParser.prototype.parseFromString;
        const mockRow = document.createElement('tr');
        mockRow.setAttribute('data-epic-id', '42');
        Object.defineProperty(mockRow, 'getAttributeNames', { value: undefined, configurable: true });
        const mockDoc = {
            querySelector: () => mockRow,
            body: { childNodes: [] },
        };
        DOMParser.prototype.parseFromString = vi.fn(() => mockDoc as unknown as Document);
        const { setupAddChildForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts');
        const onCreate = vi.fn().mockResolvedValue({ id: 42 });
        const getRowHtml = vi.fn().mockReturnValue('<tr data-epic-id="42"><td>Test</td></tr>');
        const config = createMockConfig({ onCreate, getRowHtml });
        setupAddChildForm(config as Parameters<typeof setupAddChildForm>[0]);
        const form = document.getElementById('add-form') as HTMLFormElement;
        const input = document.getElementById('statement-input') as HTMLInputElement;
        input.value = 'test';
        await form.dispatchEvent(new Event('submit'));
        expect(onCreate).toHaveBeenCalledWith('test', undefined);
        DOMParser.prototype.parseFromString = origParseFromString;
    });
});
