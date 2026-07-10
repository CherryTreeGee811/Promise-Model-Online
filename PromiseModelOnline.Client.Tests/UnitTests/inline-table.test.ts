import { describe, it, expect, vi } from 'vitest';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts';

describe('renderTableWithInlineAddRow', () => {
    const headers = ['Name', 'Value'];
    const renderItemRow = (item: unknown) => `<tr><td>${String(item)}</td></tr>`;

    it('throws for null container', () => {
        expect(() => renderTableWithInlineAddRow(null as unknown as HTMLElement, {
            headers,
            items: [],
            renderItemRow,
        })).toThrow();
    });

    it('renders table with items and returns tbody', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: ['a', 'b'],
            renderItemRow,
        });
        expect(tbody).not.toBeNull();
        expect(tbody!.tagName).toBe('TBODY');
        expect(tbody!.querySelectorAll('tr')).toHaveLength(2);
        expect(tbody!.querySelector('tr:first-child td')?.textContent).toBe('a');
    });

    it('renders headers correctly', () => {
        const container = document.createElement('div');
        renderTableWithInlineAddRow(container, {
            headers,
            items: [],
            renderItemRow,
        });
        const ths = container.querySelectorAll('thead th');
        expect(ths).toHaveLength(2);
        expect(ths[0].textContent).toBe('Name');
        expect(ths[1].textContent).toBe('Value');
    });

    it('creates inline-table-empty-row when items is empty and no emptyConfig', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: [],
            emptyMessage: 'Nothing here',
            renderItemRow,
        });
        const emptyRow = tbody!.querySelector('.inline-table-empty-row') as HTMLElement;
        expect(emptyRow).not.toBeNull();
        expect(emptyRow.querySelector('.no-items')?.textContent).toBe('Nothing here');
    });

    it('creates empty row via emptyConfig when provided', () => {
        const container = document.createElement('div');
        const emptyConfig = { title: 'Custom Empty' };
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: [],
            emptyConfig,
            renderItemRow,
        });
        const emptyRow = tbody!.querySelector('.inline-table-empty-row');
        expect(emptyRow).not.toBeNull();
        expect(tbody!.innerHTML).toContain('Custom Empty');
    });

    it('handles null items array', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: null as unknown as unknown[],
            renderItemRow,
        });
        const emptyRow = tbody!.querySelector('.inline-table-empty-row');
        expect(emptyRow).not.toBeNull();
    });

    it('handles undefined items array', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: undefined as unknown as unknown[],
            renderItemRow,
        });
        const emptyRow = tbody!.querySelector('.inline-table-empty-row');
        expect(emptyRow).not.toBeNull();
    });

    it('includes add row when renderAddRow returns HTML', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: ['a'],
            renderItemRow,
            renderAddRow: () => '<tr data-inline-add-row="1"><td>Add</td></tr>',
        });
        const addRow = tbody!.querySelector('tr[data-inline-add-row="1"]');
        expect(addRow).not.toBeNull();
        expect(tbody!.querySelectorAll('tr')).toHaveLength(2);
    });

    it('handles empty renderAddRow default', () => {
        const container = document.createElement('div');
        const tbody = renderTableWithInlineAddRow(container, {
            headers,
            items: ['a'],
            renderItemRow,
        });
        expect(tbody!.querySelectorAll('tr')).toHaveLength(1);
    });
});

describe('insertRowBeforeAddRow', () => {
    it('inserts before existing add-row', () => {
        const tbody = document.createElement('tbody');
        const addRow = document.createElement('tr');
        addRow.setAttribute('data-inline-add-row', '1');
        tbody.append(addRow);
        const newRow = document.createElement('tr');
        insertRowBeforeAddRow(tbody, newRow);
        expect(tbody.children).toHaveLength(2);
        expect(tbody.children[0]).toBe(newRow);
        expect(tbody.children[1]).toBe(addRow);
    });

    it('appends to end when no add-row found', () => {
        const tbody = document.createElement('tbody');
        const existing = document.createElement('tr');
        tbody.append(existing);
        const newRow = document.createElement('tr');
        insertRowBeforeAddRow(tbody, newRow);
        expect(tbody.children).toHaveLength(2);
        expect(tbody.children[1]).toBe(newRow);
    });
});

describe('removeInlineEmptyRow', () => {
    it('removes row with class inline-table-empty-row', () => {
        const tbody = document.createElement('tbody');
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'inline-table-empty-row';
        tbody.append(emptyRow);
        removeInlineEmptyRow(tbody);
        expect(tbody.children.length).toBe(0);
    });

    it('does nothing when no empty row exists', () => {
        const tbody = document.createElement('tbody');
        const row = document.createElement('tr');
        tbody.append(row);
        removeInlineEmptyRow(tbody);
        expect(tbody.children.length).toBe(1);
    });
});
