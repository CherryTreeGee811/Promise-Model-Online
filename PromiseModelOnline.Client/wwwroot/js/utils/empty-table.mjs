import { escapeHtml } from './html.mjs';

/**
 * Render an empty table row with icon, title, description, and optional button.
 * @param {object} options
 * @param {string} [options.icon] - Bootstrap icon class.
 * @param {string} [options.title] - Empty state title.
 * @param {string} [options.description] - Empty state description.
 * @param {object} [options.button] - Optional button config with id, class, text, icon.
 * @param {number} options.colspan - Table column span.
 * @returns {string} The table row HTML.
 */
export function renderEmptyTableRow({ icon, title, description, button, colspan }) {
    const iconHtml = icon
        ? `<div class="empty-table-icon"><i class="bi ${escapeHtml(icon)}"></i></div>`
        : '';
    const titleHtml = title
        ? `<h5 class="fw-semibold text-secondary mb-1">${escapeHtml(title)}</h5>`
        : '';
    const descHtml = description
        ? `<p class="text-muted mb-2">${escapeHtml(description)}</p>`
        : '';
    const btnHtml = button
        ? `<button${button.id ? ` id="${escapeHtml(button.id)}"` : ''} class="${escapeHtml(button.class || 'btn btn-outline-primary rounded-pill mt-2')}" type="button">${button.icon ? `<i class="bi ${escapeHtml(button.icon)} me-1"></i> ` : ''}${escapeHtml(button.text)}</button>`
        : '';

    return `
        <tr class="inline-table-empty-row">
            <td colspan="${colspan}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${iconHtml}
                    ${titleHtml}
                    ${descHtml}
                    ${btnHtml}
                </div>
            </td>
        </tr>
    `;
}

/**
 * Render an empty state section (non-table) with icon, title, description, and optional button.
 * @param {object} options
 * @param {string} [options.icon] - Bootstrap icon class.
 * @param {string} [options.title] - Empty state title.
 * @param {string} [options.description] - Empty state description.
 * @param {object} [options.button] - Optional button config.
 * @returns {string} The section HTML.
 */
export function renderEmptyStateSection({ icon, title, description, button }) {
    const iconHtml = icon
        ? `<div class="empty-table-icon"><i class="bi ${escapeHtml(icon)}"></i></div>`
        : '';
    const titleHtml = title
        ? `<h5 class="fw-semibold text-secondary mb-1">${escapeHtml(title)}</h5>`
        : '';
    const descHtml = description
        ? `<p class="text-muted mb-2">${escapeHtml(description)}</p>`
        : '';
    const btnHtml = button
        ? `<button${button.id ? ` id="${escapeHtml(button.id)}"` : ''} class="${escapeHtml(button.class || 'btn btn-outline-primary rounded-pill mt-2')}" type="button">${button.icon ? `<i class="bi ${escapeHtml(button.icon)} me-1"></i> ` : ''}${escapeHtml(button.text)}</button>`
        : '';

    return `
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${iconHtml}
            ${titleHtml}
            ${descHtml}
            ${btnHtml}
        </div>
    `;
}
