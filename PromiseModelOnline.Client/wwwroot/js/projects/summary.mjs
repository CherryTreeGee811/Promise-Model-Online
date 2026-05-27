export function renderSummaryTable(container, rows) {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="table-responsive summary-table-wrap">
            <table class="table table-sm table-striped table-hover align-middle mb-0 detail-table summary-table">
            <tbody class="table-group-divider">
                ${rows.map(row => `
                    ${row.isGap
                        ? `<tr class="summary-gap"><td colspan="2" class="border-0 py-2"></td></tr>`
                        : `<tr>
                            <th scope="row" class="summary-key text-muted fw-semibold">${escapeHtml(row.label)}</th>
                            <td class="summary-value">${escapeHtml(row.value)}</td>
                        </tr>`}
                `).join('')}
            </tbody>
            </table>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}