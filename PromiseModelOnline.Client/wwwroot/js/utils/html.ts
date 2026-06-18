// @ts-nocheck
/**
 * Escape HTML special characters (&, <, >, ", ') in a value.
 * @param {unknown} value - Value to escape (stringified).
 * @returns {string} Escaped HTML-safe string.
 */
export function escapeHtml(value: unknown): string {
    return String(value).replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}

/**
 * Render a Bootstrap spinner with a screen-reader accessible message.
 * @param {string} message - Text shown to assistive technology.
 * @returns {string} HTML string for the loading spinner.
 */
export function renderLoadingSpinner(message: string): string {
    return `
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(message)}">
                <span class="visually-hidden">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}
