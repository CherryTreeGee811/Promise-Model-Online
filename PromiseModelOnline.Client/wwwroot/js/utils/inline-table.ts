// @ts-nocheck
import { renderEmptyTableRow } from './empty-table.ts';
import { escapeHtml } from './html.ts';

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
 * @param container - Target DOM element to render into.
 * @param config.headers - Column header labels.
 * @param root0
 * @param root0.headers
 * @param config.items - Array of data items to render.
 * @param root0.items
 * @param config.emptyMessage - Fallback text when items is empty and no emptyConfig.
 * @param root0.emptyMessage
 * @param config.emptyConfig - Empty-table-row options (overrides emptyMessage).
 * @param root0.emptyConfig
 * @param config.renderItemRow - Callback producing HTML for each item row.
 * @param root0.renderItemRow
 * @param config.renderAddRow - Callback producing HTML for the add row.
 * @param root0.renderAddRow
 * @returns The tbody element, or null if container is missing.
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
    const rowsHtml = items && items.length
        ? items.map(renderItemRow).join('')
        : emptyConfig
            ? renderEmptyTableRow({ colspan: columnCount, ...emptyConfig })
            : `<tr class="inline-table-empty-row"><td class="no-items" colspan="${columnCount}">${escapeHtml(emptyMessage)}</td></tr>`;

    const addRowHtml = renderAddRow ? renderAddRow() : '';

    container.innerHTML = `
        <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle mb-0 promisemodel-table">
            <thead class="table-light">
                <tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
                ${addRowHtml}
            </tbody>
        </table>
        </div>
    `;

    return container.querySelector('tbody');
}

/**
 * Insert a row element before the inline add-row in a tbody.
 * Appends to the end if no add-row is found.
 * @param tbody - The table body element.
 * @param rowElement - The new row element to insert.
 */
export function insertRowBeforeAddRow(tbody: HTMLElement, rowElement: HTMLElement): void {
    const addRow = tbody.querySelector('tr[data-inline-add-row="1"]');
    if (addRow) {
        tbody.insertBefore(rowElement, addRow);
        return;
    }

    tbody.appendChild(rowElement);
}

/**
 * Remove the empty-state row from a table body if present.
 * @param tbody - The table body element.
 */
export function removeInlineEmptyRow(tbody: HTMLElement): void {
    tbody.querySelector('.inline-table-empty-row')?.remove();
}
