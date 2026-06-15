/** Status display configuration: value, label, and emoji icon. */
export const STATUS_OPTIONS = [
    { value: 'Todo', label: 'Todo', icon: '\u{1F534}' },
    { value: 'InProgress', label: 'In Progress', icon: '\u{1F7E0}' },
    { value: 'Blocked', label: 'Blocked', icon: '\u{26AB}\uFE0F' },
    { value: 'Done', label: 'Done', icon: '\u{1F7E2}' },
];

/**
 * Get the emoji icon for a status color string.
 * @param {string} statusOrColor - The raw status color (e.g., "red", "green", "blocked").
 * @returns {string} The emoji character.
 */
export function getStatusIcon(statusOrColor) {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '\u{1F7E2}';
    if (normalized.includes('black') || normalized.includes('blocked')) return '\u{26AB}\uFE0F';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '\u{1F7E0}';
    if (normalized.includes('red') || normalized.includes('todo')) return '\u{1F534}';
    return '\u26AA';
}

/**
 * Derive a human-readable status label from a color string.
 * @param {string} statusOrColor - The raw status color.
 * @returns {string} The status label ("Todo", "In Progress", "Blocked", "Done", or "Unknown").
 */
export function getStatusLabel(statusOrColor) {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return 'Done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'Blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'In Progress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'Todo';
    return 'Unknown';
}

/**
 * Generate HTML for a status badge with icon and screen-reader label.
 * @param {string} statusOrColor - The raw status color.
 * @returns {string} The HTML string.
 */
export function getStatusHtml(statusOrColor) {
    return `<span aria-hidden="true">${getStatusIcon(statusOrColor)}</span><span class="sr-only">${getStatusLabel(statusOrColor)}</span>`;
}

/**
 * Categorize a status color into a bucket name for filtering.
 * @param {string} statusColor - The raw status color.
 * @returns {string} The bucket name: "done", "blocked", "inprogress", "todo", or "other".
 */
export function getStatusBucket(statusColor) {
    const normalized = String(statusColor ?? '').trim().toLowerCase();

    if (!normalized || normalized === 'all') return 'other';
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';

    return 'other';
}

/**
 * Generate an HTML option element for a status select dropdown.
 * @param {string} value - The status value (e.g., "Todo", "Done").
 * @param {string} [selectedValue] - The currently selected value for comparison.
 * @returns {string} The HTML option string.
 */
export function getStatusOptionHtml(value, selectedValue) {
    const option = STATUS_OPTIONS.find(o => o.value === value);
    if (!option) return `<option value="${value}">${value}</option>`;
    const selected = value === selectedValue ? ' selected' : '';
    return `<option value="${value}"${selected}>${option.icon} ${option.label}</option>`;
}
