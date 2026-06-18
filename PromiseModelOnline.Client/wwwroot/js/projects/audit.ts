// @ts-nocheck
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.ts';

interface AuditChange {
    fieldName: string;
    before: unknown;
    after: unknown;
}

interface AuditItem {
    occurredAtUtc: string;
    actorEmail?: string;
    actorSubject?: string;
    actorUserId?: string;
    actionType: string;
    changes?: AuditChange[];
    entityType: string;
    entityId: string | number;
}

interface AuditTableOptions {
    showEntity?: boolean;
}

/**
 * Render an HTML audit table from a list of audit items.
 * @param items - The audit items to render, or null/undefined for an empty state.
 * @param options - Options including whether to show the entity column.
 * @param options.showEntity
 * @returns The rendered HTML string.
 */
export function renderAuditTable(items: AuditItem[] | null | undefined, { showEntity = false }: AuditTableOptions = {}): string {
    if (!items || items.length === 0) {
        return renderEmptyStateSection({
            icon: 'bi-activity',
            title: 'No activity recorded yet.',
            description: 'Changes made to this project will appear here.',
        });
    }

    const rows = items.map(item => `
        <tr>
            <td>
                <time class="audit-time" title="${escapeHtml(formatTimestamp(item.occurredAtUtc))}">${escapeHtml(formatRelativeTime(item.occurredAtUtc))}</time>
            </td>
            <td>${escapeHtml(formatActor(item))}</td>
            <td>${escapeHtml(formatEventType(item))}</td>
            <td>${escapeHtml(formatChange(item))}</td>
            <td>${escapeHtml(formatEntity(item))}</td>
            <td>
                <a href="#" class="audit-show-details-link" data-audit-details="${escapeHtml(encodeAuditDetails(item))}">show details</a>
            </td>
        </tr>
    `).join('');

    return `
        <div class="table-responsive">
            <table class="table table-striped table-hover table-sm align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col">Time</th>
                        <th scope="col">User</th>
                        <th scope="col">Event Type</th>
                        <th scope="col">Change</th>
                        <th scope="col">Items Affected</th>
                        <th scope="col">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Render the audit loading spinner HTML.
 * @param message - The loading message to display.
 * @returns The loading spinner HTML string.
 */
export function renderAuditLoading(message = 'Loading activity'): string {
    return renderLoadingSpinner(message);
}

/**
 * Render the audit details modal HTML.
 * @returns The modal HTML string.
 */
export function renderAuditDetailsModal(): string {
    return `
        <div class="modal fade" id="audit-details-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="audit-details-modal-title">Audit details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="audit-details-modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Format a timestamp value into a human-readable date-time string.
 * @param value - The timestamp as a string, Date, or null.
 * @returns The formatted date-time string, or 'Unknown' if invalid.
 */
export function formatTimestamp(value: string | Date | null | undefined): string {
    if (!value) return 'Unknown';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

/**
 * Format a timestamp as a relative time string (e.g. "3 minutes ago").
 * @param value - The timestamp as a string, Date, or null.
 * @returns The relative time string, or 'Unknown' if invalid.
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
    if (!value) return 'Unknown';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    if (date.getTime() > Date.now()) {
        return 'just now';
    }

    const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    const absSeconds = diffSeconds;

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const units: [string, number][] = [
        ['year', 60 * 60 * 24 * 365],
        ['month', 60 * 60 * 24 * 30],
        ['week', 60 * 60 * 24 * 7],
        ['day', 60 * 60 * 24],
        ['hour', 60 * 60],
        ['minute', 60],
        ['second', 1],
    ];

    for (const [unit, secondsPerUnit] of units) {
        if (absSeconds >= secondsPerUnit || unit === 'second') {
            const valueInUnits = Math.round(diffSeconds / secondsPerUnit);
            return rtf.format(-valueInUnits, unit as Intl.RelativeTimeFormatUnit);
        }
    }

    return rtf.format(0, 'second');
}

/**
 * Format the title for an audit details modal from the given audit item.
 * @param item - The audit item.
 * @returns The formatted title string.
 */
export function formatAuditDetailsTitle(item: AuditItem): string {
    return `${formatEventType(item)} ${formatEntity(item)}`;
}

/**
 * Format the full audit details as an HTML definition list.
 * @param item - The audit item.
 * @returns The HTML string for the details body.
 */
export function formatAuditDetailsHtml(item: AuditItem): string {
    return `
        <dl class="row mb-0">
            <dt class="col-sm-3">Time</dt>
            <dd class="col-sm-9"><time title="${escapeHtml(formatTimestamp(item.occurredAtUtc))}">${escapeHtml(formatTimestamp(item.occurredAtUtc))}</time></dd>
            <dt class="col-sm-3">User</dt>
            <dd class="col-sm-9">${escapeHtml(formatActor(item))}</dd>
            <dt class="col-sm-3">Event Type</dt>
            <dd class="col-sm-9">${escapeHtml(formatEventType(item))}</dd>
            <dt class="col-sm-3">Change</dt>
            <dd class="col-sm-9">${escapeHtml(formatChange(item))}</dd>
            <dt class="col-sm-3">Items Affected</dt>
            <dd class="col-sm-9">${escapeHtml(formatEntity(item))}</dd>
            <dt class="col-sm-3">Details</dt>
            <dd class="col-sm-9">${renderChanges(item.changes)}</dd>
        </dl>
    `;
}

interface AuditDetailsPayload {
    title: string;
    html: string;
}

/**
 * Get the title and HTML payload for an audit details modal from an audit item.
 * @param item - The audit item.
 * @returns An object with title and html properties for the modal.
 */
export function getAuditDetailsPayload(item: AuditItem): AuditDetailsPayload {
    return {
        title: formatAuditDetailsTitle(item),
        html: formatAuditDetailsHtml(item),
    };
}

/**
 *
 * @param changes
 */
function renderChanges(changes: AuditChange[] | undefined): string {
    if (!Array.isArray(changes) || changes.length === 0) {
        return '<span class="text-muted">No field details</span>';
    }

    const visibleChanges = changes.filter(change => !isIgnoredField(change.fieldName));

    if (visibleChanges.length === 0) {
        return '<span class="text-muted">No visible field changes</span>';
    }

    return `<ul class="mb-0 ps-3">${visibleChanges.map(change => `
        <li>${escapeHtml(change.fieldName)}: ${escapeHtml(formatValue(change.before))} → ${escapeHtml(formatValue(change.after))}</li>
    `).join('')}</ul>`;
}

/**
 *
 * @param item
 */
function formatActor(item: AuditItem): string {
    return item.actorEmail || item.actorSubject || item.actorUserId || 'System';
}

/**
 *
 * @param item
 */
function formatEventType(item: AuditItem): string {
    if (item.actionType === 'StatusChanged') return 'Status Changed';
    if (item.actionType === 'Created') return 'Created';
    if (item.actionType === 'Deleted') return 'Deleted';
    return 'Updated';
}

/**
 *
 * @param item
 */
function formatChange(item: AuditItem): string {
    const changes = Array.isArray(item.changes) ? item.changes.filter(change => !isIgnoredField(change.fieldName)) : [];

    if (item.actionType === 'StatusChanged') {
        const statusChange = changes.find(change => change.fieldName === 'Status');
        if (statusChange) {
            return `${formatValue(statusChange.before)} → ${formatValue(statusChange.after)}`;
        }
    }

    if (item.actionType === 'Created') {
        return 'Created';
    }

    if (item.actionType === 'Deleted') {
        return 'Deleted';
    }

    if (changes.length === 0) {
        return 'Updated';
    }

    return changes.map(change => change.fieldName).join(', ');
}

/**
 *
 * @param item
 */
function formatEntity(item: AuditItem): string {
    return `${item.entityType} #${item.entityId}`;
}

/**
 *
 * @param fieldName
 */
function isIgnoredField(fieldName: string): boolean {
    return String(fieldName).toLowerCase() === 'updatedat';
}

/**
 *
 * @param item
 */
function encodeAuditDetails(item: AuditItem): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(getAuditDetailsPayload(item)))));
}

/**
 *
 * @param value
 */
function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return 'blank';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}
