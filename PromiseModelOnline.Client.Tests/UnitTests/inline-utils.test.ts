import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({ patchChildMetrics: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="test-container"><table id="test-table"><tbody></tbody></table></div>';
});

describe('renderTableWithInlineAddRow', () => {
    it('renders table with headers', async () => {
        const { renderTableWithInlineAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const container = document.getElementById('test-container')!;
        const tbody = renderTableWithInlineAddRow(container, {
            headers: ['Name', 'Actions'],
            items: [{ name: 'Item 1' }],
            renderItemRow: (item: unknown) => '<tr><td>' + (item as Record<string, unknown>).name + '</td><td><button>View</button></td></tr>',
            renderAddRow: () => '<tr><td><input></td><td><button>Add</button></td></tr>',
            emptyMessage: 'No items',
        });
        expect(tbody).not.toBeNull();
        expect(container.innerHTML).toContain('Item 1');
    });
});

describe('removeInlineEmptyRow', () => {
    it('removes empty row if present', async () => {
        const { removeInlineEmptyRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const tbody = document.createElement('tbody');
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'inline-table-empty-row';
        tbody.append(emptyRow);
        removeInlineEmptyRow(tbody);
        expect(tbody.children.length).toBe(0);
    });
});

describe('insertRowBeforeAddRow', () => {
    it('inserts row before the add row', async () => {
        const { insertRowBeforeAddRow } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts');
        const tbody = document.createElement('tbody');
        const addRow = document.createElement('tr');
        addRow.dataset.inlineAddRow = '1';
        tbody.append(addRow);
        const newRow = document.createElement('tr');
        insertRowBeforeAddRow(tbody, newRow);
        expect(tbody.children[0]).toBe(newRow);
    });
});

describe('renderEmptyStateSection', () => {
    it('renders empty state with icon and message', async () => {
        const { renderEmptyStateSection } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/empty-table.ts');
        const el = renderEmptyStateSection({ icon: 'bi-clock', title: 'No data', description: 'Add some data.' });
        expect(el.querySelector('.bi-clock')).not.toBeNull();
        expect(el.textContent).toContain('No data');
        expect(el.textContent).toContain('Add some data.');
    });
});
