// @ts-nocheck
import { escapeHtml } from './html.ts';

/**
 * @typedef {{ icon?: string; title?: string; description?: string; button?: { id?: string; class?: string; text: string; icon?: string }; colspan: number }} EmptyTableOptions
 */

/**
 * Render an HTML table row with an empty-state message and optional CTA button.
 * @param {EmptyTableOptions} options - Configuration for the empty row.
 * @param {string} [options.icon] - Icon class for the empty state.
 * @param {string} [options.title] - Title text for the empty state.
 * @param {string} [options.description] - Description text for the empty state.
 * @param {object} [options.button] - Button configuration.
 * @param {number} options.colspan - Number of columns the row should span.
 * @returns {string} HTML string for the empty table row.
 */
export function renderEmptyTableRow({ icon, title, description, button, colspan }: EmptyTableOptions): string {
    const iconHtml = icon
        ? `<div class="empty-table-icon"><i class="bi ${escapeHtml(icon)}"></i></div>`
        : '';
    const titleHtml = title
        ? `<h5 class="fw-semibold text-secondary mb-1">${escapeHtml(title)}</h5>`
        : '';
    const descHtml = description
        ? `<p class="text-muted mb-2">${escapeHtml(description)}</p>`
        : '';
    const buttonHtml = button
        ? `<button${button.id ? ` id="${escapeHtml(button.id)}"` : ''} class="${escapeHtml(button.class || 'btn btn-outline-primary rounded-pill mt-2')}" type="button">${button.icon ? `<i class="bi ${escapeHtml(button.icon)} me-1"></i> ` : ''}${escapeHtml(button.text)}</button>`
        : '';

    return `
        <tr class="inline-table-empty-row">
            <td colspan="${colspan}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${iconHtml}
                    ${titleHtml}
                    ${descHtml}
                    ${buttonHtml}
                </div>
            </td>
        </tr>
    `;
}

/**
 * @typedef {{ icon?: string; title?: string; description?: string; button?: { id?: string; class?: string; text: string; icon?: string } }} EmptySectionOptions
 */

/**
 * Render an HTML div with an empty-state message and optional CTA button.
 * Used for sections that are not inside a table.
 * @param {EmptySectionOptions} options - Configuration for the empty state.
 * @param {string} [options.icon] - Icon class for the empty state.
 * @param {string} [options.title] - Title text for the empty state.
 * @param {string} [options.description] - Description text for the empty state.
 * @param {object} [options.button] - Button configuration.
 * @returns {string} HTML string for the empty state section.
 */
export function renderEmptyStateSection({ icon, title, description, button }: EmptySectionOptions): string {
    const iconHtml = icon
        ? `<div class="empty-table-icon"><i class="bi ${escapeHtml(icon)}"></i></div>`
        : '';
    const titleHtml = title
        ? `<h5 class="fw-semibold text-secondary mb-1">${escapeHtml(title)}</h5>`
        : '';
    const descHtml = description
        ? `<p class="text-muted mb-2">${escapeHtml(description)}</p>`
        : '';
    const buttonHtml = button
        ? `<button${button.id ? ` id="${escapeHtml(button.id)}"` : ''} class="${escapeHtml(button.class || 'btn btn-outline-primary rounded-pill mt-2')}" type="button">${button.icon ? `<i class="bi ${escapeHtml(button.icon)} me-1"></i> ` : ''}${escapeHtml(button.text)}</button>`
        : '';

    return `
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${iconHtml}
            ${titleHtml}
            ${descHtml}
            ${buttonHtml}
        </div>
    `;
}
