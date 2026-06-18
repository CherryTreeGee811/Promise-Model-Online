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
 * @param {AuditItem[] | null | undefined} items - The audit items to render, or null/undefined for an empty state.
 * @param {AuditTableOptions} [options] - Options including whether to show the entity column.
 * @param {boolean} [options.showEntity] - Whether to show the entity column.
 * @returns {string} The rendered HTML string.
 */
export function renderAuditTable(items: AuditItem[] | null | undefined, { showEntity = false }: AuditTableOptions = {}): string {
    if (!items || items.length === 0) {
        return renderEmptyStateSection({
            icon: 'bi-activity',
            title: 'No activity recorded yet.',
            description: 'Changes made to this project will appear here.',
        }).outerHTML;
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
 * @param {string} [message] - The loading message to display.
 * @returns {string} The loading spinner HTML string.
 */
export function renderAuditLoading(message = 'Loading activity'): string {
    return renderLoadingSpinner(message).outerHTML;
}

/**
 * Render the audit details modal HTML.
 * @returns {string} The modal HTML string.
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
 * @param {string | Date | null | undefined} value - The timestamp as a string, Date, or null.
 * @returns {string} The formatted date-time string, or 'Unknown' if invalid.
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
 * @param {string | Date | null | undefined} value - The timestamp as a string, Date, or null.
 * @returns {string} The relative time string, or 'Unknown' if invalid.
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
 * @param {AuditItem} item - The audit item.
 * @returns {string} The formatted title string.
 */
export function formatAuditDetailsTitle(item: AuditItem): string {
    return `${formatEventType(item)} ${formatEntity(item)}`;
}

/**
 * Format the full audit details as an HTML definition list.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The HTML string for the details body.
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
 * @param {AuditItem} item - The audit item.
 * @returns {AuditDetailsPayload} An object with title and html properties for the modal.
 */
export function getAuditDetailsPayload(item: AuditItem): AuditDetailsPayload {
    return {
        title: formatAuditDetailsTitle(item),
        html: formatAuditDetailsHtml(item),
    };
}

/**
 * Render the changes list as HTML list items.
 * @param {AuditChange[] | undefined} changes - The list of field changes.
 * @returns {string} The rendered HTML string.
 */
function renderChanges(changes: AuditChange[] | undefined): string {
    if (!Array.isArray(changes) || changes.length === 0) {
        return '<span class="text-muted">No field details</span>';
    }

    const visibleChanges = changes.filter(change => !isIgnoredField(change.fieldName));

    if (visibleChanges.length === 0) {
        return '<span class="text-muted">No visible field changes</span>';
    }

    const items = visibleChanges.map(change =>
        `<li>${escapeHtml(change.fieldName)}: ${escapeHtml(formatValue(change.before))} → ${escapeHtml(formatValue(change.after))}</li>`
    ).join('');
    return `<ul class="mb-0 ps-3">${items}</ul>`;
}

/**
 * Format the actor display string from an audit item.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The formatted actor string.
 */
function formatActor(item: AuditItem): string {
    return item.actorEmail || item.actorSubject || item.actorUserId || 'System';
}

/**
 * Format the event type display string from an audit item.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The formatted event type string.
 */
function formatEventType(item: AuditItem): string {
    if (item.actionType === 'StatusChanged') return 'Status Changed';
    if (item.actionType === 'Created') return 'Created';
    if (item.actionType === 'Deleted') return 'Deleted';
    return 'Updated';
}

/**
 * Format the change summary string from an audit item.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The formatted change summary string.
 */
function formatChange(item: AuditItem): string {
    const changes = Array.isArray(item.changes) ? item.changes.filter(change => !isIgnoredField(change.fieldName)) : [];

    switch (item.actionType) {
        case 'StatusChanged': {
            const statusChange = changes.find(change => change.fieldName === 'Status');
            if (statusChange) {
                return `${formatValue(statusChange.before)} → ${formatValue(statusChange.after)}`;
            }

            break;
        }
        case 'Created': { return 'Created'; }
        case 'Deleted': { return 'Deleted'; }
    }

    if (changes.length === 0) {
        return 'Updated';
    }

    return changes.map(change => change.fieldName).join(', ');
}

/**
 * Format the entity display string from an audit item.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The formatted entity string.
 */
function formatEntity(item: AuditItem): string {
    return `${item.entityType} #${item.entityId}`;
}

/**
 * Check whether a field name should be ignored in audit display.
 * @param {string} fieldName - The field name to check.
 * @returns {boolean} True if the field should be ignored.
 */
function isIgnoredField(fieldName: string): boolean {
    return fieldName.toLowerCase() === 'updatedat';
}

/**
 * Encode an audit item's details payload as a base64 string.
 * @param {AuditItem} item - The audit item.
 * @returns {string} The base64-encoded details string.
 */
function encodeAuditDetails(item: AuditItem): string {
    const json = JSON.stringify(getAuditDetailsPayload(item));
    const bytes = new TextEncoder().encode(json);
    // eslint-disable-next-line unicorn/prefer-uint8array-base64
    return btoa(String.fromCodePoint(...bytes));
}

/**
 * Format a raw value for display in the audit log.
 * @param {unknown} value - The value to format.
 * @returns {string} The formatted display string.
 */
function formatValue(value: unknown): string {
    if (value === undefined || value === '') {
        return 'blank';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}
