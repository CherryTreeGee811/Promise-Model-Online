// @ts-nocheck
import { escapeHtml } from '../utils/html.ts';

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
