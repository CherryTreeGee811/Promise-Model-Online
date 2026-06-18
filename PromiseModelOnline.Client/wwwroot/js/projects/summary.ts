interface SummaryRow {
    label?: string;
    value?: string | number;
    isGap?: boolean;
}

/**
 * Render a summary table with the given rows into a container element.
 * Each row can have a label/value pair or be a gap row (isGap: true).
 * @param {HTMLElement } container - The container element to render into.
 * @param {SummaryRow[]} rows - The summary rows to render.
 */
export function renderSummaryTable(container: HTMLElement | null, rows: SummaryRow[]): void {
    if (!container) {
        return;
    }

    container.replaceChildren();

    const wrapDiv = document.createElement('div');
    wrapDiv.className = 'table-responsive summary-table-wrap';

    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-hover align-middle mb-0 detail-table summary-table';

    const tbody = document.createElement('tbody');
    tbody.className = 'table-group-divider';

    for (const row of rows) {
        if (row.isGap) {
            const gapTr = document.createElement('tr');
            gapTr.className = 'summary-gap';
            const gapTd = document.createElement('td');
            gapTd.colSpan = 2;
            gapTd.className = 'border-0 py-2';
            gapTr.append(gapTd);
            tbody.append(gapTr);
        } else {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.scope = 'row';
            th.className = 'summary-key text-muted fw-semibold';
            th.textContent = row.label ?? '';
            const td = document.createElement('td');
            td.className = 'summary-value';
            td.textContent = row.value === undefined ? '' : String(row.value);
            tr.append(th, td);
            tbody.append(tr);
        }
    }

    table.append(tbody);
    wrapDiv.append(table);
    container.append(wrapDiv);
}
