/**
 * Escape HTML special characters to prevent XSS.
 * @param {*} value - The value to escape.
 * @returns {string} The escaped HTML string.
 */
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}

/**
 * Render a Bootstrap loading spinner with a custom message.
 * @param {string} message - The accessible label for the spinner.
 * @returns {string} The spinner HTML.
 */
export function renderLoadingSpinner(message) {
    return `
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(message)}">
                <span class="visually-hidden">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}
