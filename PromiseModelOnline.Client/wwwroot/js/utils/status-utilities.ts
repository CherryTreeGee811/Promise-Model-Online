// @ts-nocheck
interface StatusOption {
    value: string;
    label: string;
    icon: string;
}

/** Available status options with value, label, and emoji icon. */
export const STATUS_OPTIONS: StatusOption[] = [
    { value: 'Todo', label: 'Todo', icon: '\u{1F534}' },
    { value: 'InProgress', label: 'In Progress', icon: '\u{1F7E0}' },
    { value: 'Blocked', label: 'Blocked', icon: '\u{26AB}\u{FE0F}' },
    { value: 'Done', label: 'Done', icon: '\u{1F7E2}' },
];

/**
 * Map a status or color string to its emoji icon.
 * @param {string} statusOrColor - Status label or color keyword.
 * @returns {string} Emoji character representing the status.
 */
export function getStatusIcon(statusOrColor: string): string {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '\u{1F7E2}';
    if (normalized.includes('black') || normalized.includes('blocked')) return '\u{26AB}\u{FE0F}';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '\u{1F7E0}';
    if (normalized.includes('red') || normalized.includes('todo')) return '\u{1F534}';
    return '\u{26AA}';
}

/**
 * Map a status or color string to its human-readable label.
 * @param {string} statusOrColor - Status label or color keyword.
 * @returns {string} Human-readable status name.
 */
export function getStatusLabel(statusOrColor: string): string {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return 'Done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'Blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'In Progress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'Todo';
    return 'Unknown';
}

/**
 * Return HTML containing the status emoji icon plus a screen-reader label.
 * @param {string} statusOrColor - Status label or color keyword.
 * @returns {string} HTML span string.
 */
export function getStatusHtml(statusOrColor: string): string {
    return `<span aria-hidden="true">${getStatusIcon(statusOrColor)}</span><span class="sr-only">${getStatusLabel(statusOrColor)}</span>`;
}

/**
 * Normalize a status color string into a bucket key for grouping/filtering.
 * @param {string} statusColor - Raw status color string.
 * @returns {string} One of "done", "blocked", "inprogress", "todo", or "other".
 */
export function getStatusBucket(statusColor: string): string {
    const normalized = String(statusColor ?? '').trim().toLowerCase();

    if (!normalized || normalized === 'all') return 'other';
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';

    return 'other';
}

/**
 * Generate an HTML `<option>` element for a status dropdown.
 * @param {string} value - The status value.
 * @param {string} [selectedValue] - Currently selected value (for marking `selected`).
 * @returns {string} HTML option string.
 */
export function getStatusOptionHtml(value: string, selectedValue?: string): string {
    const option = STATUS_OPTIONS.find(o => o.value === value);
    if (!option) return `<option value="${value}">${value}</option>`;
    const selected = value === selectedValue ? ' selected' : '';
    return `<option value="${value}"${selected}>${option.icon} ${option.label}</option>`;
}
