import { escapeHtml } from './html.mjs';
import { renderEmptyTableRow } from './empty-table.mjs';

/**
 * Render a table with headers, item rows, and an inline add row.
 * @param {HTMLElement} container - The container to render into.
 * @param {object} config
 * @param {string[]} config.headers - Column header texts.
 * @param {Array} config.items - The item data array.
 * @param {string} [config.emptyMessage] - Message when items is empty.
 * @param {object} [config.emptyConfig] - Empty state config object for renderEmptyTableRow.
 * @param {Function} config.renderItemRow - Function returning HTML for each item.
 * @param {Function} [config.renderAddRow] - Function returning the add-row HTML.
 * @returns {HTMLElement} The table body element.
 */
export function renderTableWithInlineAddRow(container, {
    headers,
    items,
    emptyMessage,
    emptyConfig,
    renderItemRow,
    renderAddRow = () => '',
}) {
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
 * Insert a row before the inline add-row in a table body.
 * @param {HTMLElement} tbody - The table body element.
 * @param {HTMLElement} rowElement - The new row element.
 */
export function insertRowBeforeAddRow(tbody, rowElement) {
    const addRow = tbody.querySelector('tr[data-inline-add-row="1"]');
    if (addRow) {
        tbody.insertBefore(rowElement, addRow);
        return;
    }

    tbody.appendChild(rowElement);
}

/**
 * Remove the empty-state row from a table body if present.
 * @param {HTMLElement} tbody - The table body element.
 */
export function removeInlineEmptyRow(tbody) {
    tbody.querySelector('.inline-table-empty-row')?.remove();
}
