export function renderSummaryTable(container, rows) {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <table class="detail-table">
            <tbody>
                ${rows.map(row => `
                    ${row.isGap
                        ? `<tr><td colspan="2">&nbsp;</td></tr>`
                        : `<tr>
                            <th>${escapeHtml(row.label)}</th>
                            <td>${escapeHtml(row.value)}</td>
                        </tr>`}
                `).join('')}
            </tbody>
        </table>
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