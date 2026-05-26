export function renderTableWithInlineAddRow(container, {
    headers,
    items,
    emptyMessage,
    renderItemRow,
    renderAddRow = () => '',
}) {
    const columnCount = headers.length;
    const rowsHtml = items && items.length
        ? items.map(renderItemRow).join('')
        : `<tr class="inline-table-empty-row"><td class="no-items" colspan="${columnCount}">${escapeHtml(emptyMessage)}</td></tr>`;

    const addRowHtml = renderAddRow ? renderAddRow() : '';

    container.innerHTML = `
        <table class="promisemodel-table">
            <thead>
                <tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
                ${addRowHtml}
            </tbody>
        </table>
    `;

    return container.querySelector('tbody');
}

export function insertRowBeforeAddRow(tbody, rowElement) {
    const addRow = tbody.querySelector('tr[data-inline-add-row="1"]');
    if (addRow) {
        tbody.insertBefore(rowElement, addRow);
        return;
    }

    tbody.appendChild(rowElement);
}

export function removeInlineEmptyRow(tbody) {
    tbody.querySelector('.inline-table-empty-row')?.remove();
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}