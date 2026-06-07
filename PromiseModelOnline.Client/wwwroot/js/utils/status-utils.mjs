export const STATUS_OPTIONS = [
    { value: 'Todo', label: 'Todo', icon: '🔴' },
    { value: 'InProgress', label: 'In Progress', icon: '🟠' },
    { value: 'Blocked', label: 'Blocked', icon: '⚫️' },
    { value: 'Done', label: 'Done', icon: '🟢' },
];

export function getStatusIcon(statusOrColor) {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '\u{1F7E2}';
    if (normalized.includes('black') || normalized.includes('blocked')) return '\u{26AB}\uFE0F';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '\u{1F7E0}';
    if (normalized.includes('red') || normalized.includes('todo')) return '\u{1F534}';
    return '\u26AA';
}

export function getStatusLabel(statusOrColor) {
    const normalized = String(statusOrColor ?? '').toLowerCase();
    if (normalized.includes('green')) return 'Done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'Blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'In Progress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'Todo';
    return 'Unknown';
}

export function getStatusHtml(statusOrColor) {
    return `<span aria-hidden="true">${getStatusIcon(statusOrColor)}</span><span class="sr-only">${getStatusLabel(statusOrColor)}</span>`;
}

export function getStatusBucket(statusColor) {
    const normalized = String(statusColor ?? '').trim().toLowerCase();

    if (!normalized || normalized === 'all') return 'other';
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';

    return 'other';
}

export function getStatusOptionHtml(value, selectedValue) {
    const option = STATUS_OPTIONS.find(o => o.value === value);
    if (!option) return `<option value="${value}">${value}</option>`;
    const selected = value === selectedValue ? ' selected' : '';
    return `<option value="${value}"${selected}>${option.icon} ${option.label}</option>`;
}
