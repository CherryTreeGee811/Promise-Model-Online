import { describe, it, expect, beforeEach } from 'vitest';
import { renderSummaryTable } from '../../PromiseModelOnline.Client/wwwroot/js/projects/summary.ts';

describe('renderSummaryTable', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="summary"></div>';
    });

    it('renders label/value rows', () => {
        const container = document.getElementById('summary')!;
        renderSummaryTable(container, [
            { label: 'Name', value: 'Test Project' },
            { label: 'Status', value: 'Active' },
        ]);
        expect(container.innerHTML).toContain('Name');
        expect(container.innerHTML).toContain('Test Project');
        expect(container.innerHTML).toContain('Status');
        expect(container.innerHTML).toContain('Active');
    });

    it('renders gap rows', () => {
        const container = document.getElementById('summary')!;
        renderSummaryTable(container, [
            { label: 'A', value: '1' },
            { isGap: true },
            { label: 'B', value: '2' },
        ]);
        const rows = container.querySelectorAll('tr');
        expect(rows.length).toBe(3);
        expect(rows[1].classList.contains('summary-gap')).toBe(true);
    });

    it('handles empty rows array', () => {
        const container = document.getElementById('summary')!;
        renderSummaryTable(container, []);
        expect(container.querySelector('table')).not.toBeNull();
    });

    it('handles undefined values', () => {
        const container = document.getElementById('summary')!;
        renderSummaryTable(container, [{ label: 'Empty', value: undefined }]);
        expect(container.textContent).toContain('Empty');
    });
});
