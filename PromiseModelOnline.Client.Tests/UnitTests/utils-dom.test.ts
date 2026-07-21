import { describe, it, expect } from 'vitest';
import { removeInlineEmptyRow, insertRowBeforeAddRow } from '../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts';
import { renderEmptyTableRow, renderEmptyStateSection } from '../../PromiseModelOnline.Client/wwwroot/js/utils/empty-table.ts';
import { htmlToNodes } from '../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts';

describe('htmlToNodes', () => {
    it('parses a single element', () => {
        // Act
        const nodes = htmlToNodes('<div>hello</div>');
        // Assert
        expect(nodes).toHaveLength(1);
        expect(nodes[0].textContent).toBe('hello');
    });

    it('parses multiple elements', () => {
        // Act
        const nodes = htmlToNodes('<span>a</span><span>b</span>');
        // Assert
        expect(nodes).toHaveLength(2);
    });

    it('returns empty array for empty string', () => {
        // Act
        const nodes = htmlToNodes('');
        // Assert
        expect(nodes).toHaveLength(0);
    });
});

describe('renderEmptyTableRow', () => {
    it('creates a table row with icon and title', () => {
        // Act
        const row = renderEmptyTableRow({ icon: '📭', title: 'No items', description: 'Nothing to show', colspan: 4 });
        // Assert
        expect(row.tagName).toBe('TR');
        expect(row.className).toBe('inline-table-empty-row');
        expect(row.innerHTML).toContain('📭');
        expect(row.innerHTML).toContain('No items');
        expect(row.innerHTML).toContain('Nothing to show');
    });

    it('sets correct colspan on inner td', () => {
        // Arrange
        const row = renderEmptyTableRow({ icon: '📭', title: 'Empty', colspan: 5 });
        // Act
        const td = row.querySelector('td');
        // Assert
        expect(td?.getAttribute('colspan')).toBe('5');
    });
});

describe('renderEmptyStateSection', () => {
    it('creates a div element with empty state', () => {
        // Act
        const el = renderEmptyStateSection({ icon: '📭', title: 'No data', description: 'Nothing here' });
        // Assert
        expect(el.tagName).toBe('DIV');
        expect(el.className).toContain('no-items');
        expect(el.textContent).toContain('No data');
        expect(el.textContent).toContain('Nothing here');
    });
});

describe('removeInlineEmptyRow', () => {
    it('removes empty row from tbody', () => {
        // Arrange
        const tbody = document.createElement('tbody');
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'inline-table-empty-row';
        tbody.append(emptyRow);
        // Act
        removeInlineEmptyRow(tbody);
        // Assert
        expect(tbody.children.length).toBe(0);
    });

    it('does nothing on tbody without empty row', () => {
        // Arrange
        const tbody = document.createElement('tbody');
        const row = document.createElement('tr');
        tbody.append(row);
        // Act
        removeInlineEmptyRow(tbody);
        // Assert
        expect(tbody.children.length).toBe(1);
    });
});

describe('insertRowBeforeAddRow', () => {
    it('inserts row before the data-inline-add-row element', () => {
        // Arrange
        const tbody = document.createElement('tbody');
        const addRow = document.createElement('tr');
        addRow.setAttribute('data-inline-add-row', '1');
        tbody.append(addRow);
        const newRow = document.createElement('tr');
        // Act
        insertRowBeforeAddRow(tbody, newRow);
        // Assert
        expect(tbody.children.length).toBe(2);
        expect(tbody.children[0]).toBe(newRow);
    });

    it('appends if no data-inline-add-row exists', () => {
        // Arrange
        const tbody = document.createElement('tbody');
        const existing = document.createElement('tr');
        tbody.append(existing);
        const newRow = document.createElement('tr');
        // Act
        insertRowBeforeAddRow(tbody, newRow);
        // Assert
        expect(tbody.children.length).toBe(2);
        expect(tbody.children[1]).toBe(newRow);
    });
});
