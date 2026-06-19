/**
 * Escape HTML special characters (&, <, >, ", ') in a value.
 * @param {unknown} value - Value to escape (stringified).
 * @returns {string} Escaped HTML-safe string.
 */
const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/**
 * @param {unknown} value - Value to escape
 * @returns {string} Escaped HTML-safe string
 */
export function escapeHtml(value: unknown): string {
    return String(value).replaceAll(/[&<>"']/g, match => escapeMap[match]!);
}

/**
 * Render a Bootstrap spinner with a screen-reader accessible message.
 * @param {string} message - Text shown to assistive technology.
 * @returns {HTMLElement} The loading spinner element.
 */
export function renderLoadingSpinner(message: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'd-flex w-100 justify-content-center align-items-center py-5';
    div.setAttribute('aria-live', 'polite');
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', message);
    const span = document.createElement('span');
    span.className = 'visually-hidden';
    span.textContent = message;
    spinner.append(span);
    div.append(spinner);
    return div;
}

/**
 * Parse an HTML string into an array of child nodes.
 * @param {string} html - HTML string to parse
 * @returns {Node[]} Array of child nodes
 */
export function htmlToNodes(html: string): Node[] {
    const document_ = new DOMParser().parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    fragment.append(...document_.body.childNodes);
    return [...fragment.childNodes];
}

/**
 * Ensure a modal element exists in the DOM, creating it from markup if needed.
 * @param {string} modalId - The modal element ID
 * @param {string} modalMarkup - HTML string for the modal if not yet created
 * @returns {HTMLElement | null} The modal element
 */
export function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalElement = document.querySelector('#' + modalId) as HTMLElement | null;
    if (modalElement) return modalElement;

    const parser = new DOMParser();
    const document_ = parser.parseFromString(modalMarkup.trim(), 'text/html');
    modalElement = document_.body.firstElementChild as HTMLElement | null;

    if (modalElement) {
        document.body.append(modalElement);
    }

    return modalElement;
}
