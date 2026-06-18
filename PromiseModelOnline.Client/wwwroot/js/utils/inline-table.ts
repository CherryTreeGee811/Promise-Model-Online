import { renderEmptyTableRow } from './empty-table.ts';

interface TableConfig {
    headers: string[];
    items: unknown[];
    emptyMessage?: string;
    emptyConfig?: Record<string, unknown>;
    renderItemRow: (item: unknown) => string;
    renderAddRow?: () => string;
}

/**
 * Render a full table into the given container with headers, item rows, and
 * an optional inline add-row at the bottom. Handles empty state.
 * @param {HTMLElement} container - Target DOM element to render into.
 * @param {object} config - Table configuration.
 * @param {string[]} config.headers - Column header labels.
 * @param {unknown[]} config.items - Array of data items to render.
 * @param {string} [config.emptyMessage] - Fallback text when items is empty and no emptyConfig.
 * @param {Record<string, unknown>} [config.emptyConfig] - Empty-table-row options (overrides emptyMessage).
 * @param {(item: unknown) => string} config.renderItemRow - Callback producing HTML for each item row.
 * @param {() => string} [config.renderAddRow] - Callback producing HTML for the add row.
 * @returns {HTMLElement } The tbody element, or null if container is missing.
 */
export function renderTableWithInlineAddRow(container: HTMLElement, {
    headers,
    items,
    emptyMessage,
    emptyConfig,
    renderItemRow,
    renderAddRow = () => '',
}: TableConfig): HTMLElement | null {
    const columnCount = headers.length;
    container.replaceChildren();

    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-hover align-middle mb-0 promisemodel-table';

    const thead = document.createElement('thead');
    thead.className = 'table-light';
    const headerRow = document.createElement('tr');
    for (const header of headers) {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.append(th);
    }
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement('tbody');

    if (items && items.length > 0) {
        const parser = new DOMParser();
        for (const item of items) {
            const document_ = parser.parseFromString(`<table><tbody>${renderItemRow(item)}</tbody></table>`, 'text/html');
            const row = document_.querySelector('tr');
            if (row) tbody.append(row);
        }
    } else if (emptyConfig) {
        tbody.append(renderEmptyTableRow({ colspan: columnCount, ...emptyConfig }));
    } else {
        const tr = document.createElement('tr');
        tr.className = 'inline-table-empty-row';
        const td = document.createElement('td');
        td.className = 'no-items';
        td.colSpan = columnCount;
        td.textContent = emptyMessage ?? '';
        tr.append(td);
        tbody.append(tr);
    }

    const rowHtmlText = renderAddRow();
    if (rowHtmlText) {
        const parser = new DOMParser();
        const document_ = parser.parseFromString(`<table><tbody>${rowHtmlText}</tbody></table>`, 'text/html');
        const row = document_.querySelector('tr');
        if (row) tbody.append(row);
    }

    table.append(tbody);
    wrapper.append(table);
    container.append(wrapper);

    return tbody;
}

/**
 * Insert a row element before the inline add-row in a tbody.
 * Appends to the end if no add-row is found.
 * @param {HTMLElement} tbody - The table body element.
 * @param {HTMLElement} rowElement - The new row element to insert.
 */
export function insertRowBeforeAddRow(tbody: HTMLElement, rowElement: HTMLElement): void {
    const rowElement_ = tbody.querySelector('tr[data-inline-add-row="1"]');
    if (rowElement_) {
        rowElement_.before(rowElement);
        return;
    }

    tbody.append(rowElement);
}

/**
 * Remove the empty-state row from a table body if present.
 * @param {HTMLElement} tbody - The table body element.
 */
export function removeInlineEmptyRow(tbody: HTMLElement): void {
    tbody.querySelector('.inline-table-empty-row')?.remove();
}
