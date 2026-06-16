import { escapeHtml, renderLoadingSpinner } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';

/**
 * Render the audit events table as an HTML string, with optional entity column.
 * @param {object[]} items - The audit event items to render.
 * @param {{showEntity?: boolean}} [options={}] - Rendering options.
 * @returns {string} The HTML string for the audit table.
 */
export function renderAuditTable(items, { showEntity = false } = {}) {
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
 * Render a loading state for the audit section.
 * @param {string} [message='Loading activity'] - The loading message to display.
 * @returns {string} The loading spinner HTML.
 */
export function renderAuditLoading(message = 'Loading activity') {
    return renderLoadingSpinner(message);
}

/**
 * Render the HTML for the audit details modal.
 * @returns {string} The modal HTML string.
 */
export function renderAuditDetailsModal() {
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
 * Format an ISO timestamp for display.
 * @param {string|Date} value - The timestamp value.
 * @returns {string} The formatted date string.
 */
export function formatTimestamp(value) {
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
 * Format a timestamp as a relative time string (e.g. "2 days ago").
 * @param {string|Date} value - The timestamp value.
 * @returns {string} The relative time string.
 */
export function formatRelativeTime(value) {
    if (!value) return 'Unknown';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    if (date.getTime() > Date.now()) {
        return 'just now';
    }

    const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    const absSeconds = diffSeconds;

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const units = [
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
            return rtf.format(-valueInUnits, unit);
        }
    }

    return rtf.format(0, 'second');
}

/**
 * Generate a title string for an audit event detail modal.
 * @param {object} item - The audit event item.
 * @returns {string} The title string.
 */
export function formatAuditDetailsTitle(item) {
    return `${formatEventType(item)} ${formatEntity(item)}`;
}

/**
 * Generate the HTML body for an audit event detail modal.
 * @param {object} item - The audit event item.
 * @returns {string} The detail HTML string.
 */
export function formatAuditDetailsHtml(item) {
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

/**
 * Extract the before/after payload object from an audit event for the detail modal.
 * @param {object} item - The audit event item.
 * @returns {{title: string, html: string}} The title and HTML content for the modal.
 */
export function getAuditDetailsPayload(item) {
    return {
        title: formatAuditDetailsTitle(item),
        html: formatAuditDetailsHtml(item),
    };
}

/**
 * Render the list of field changes as an HTML unordered list.
 * @param {object[]} changes - The list of change objects with fieldName, before, and after.
 * @returns {string} The HTML string for the changes list.
 */
function renderChanges(changes) {
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
 * Format the actor (user) name/email from an audit event.
 * @param {object} item - The audit event item.
 * @returns {string} The actor display string.
 */
function formatActor(item) {
    return item.actorEmail || item.actorSubject || item.actorUserId || 'System';
}

/**
 * Format the event type from an audit event into a human-readable string.
 * @param {object} item - The audit event item.
 * @returns {string} The formatted event type.
 */
function formatEventType(item) {
    if (item.actionType === 'StatusChanged') return 'Status Changed';
    if (item.actionType === 'Created') return 'Created';
    if (item.actionType === 'Deleted') return 'Deleted';
    return 'Updated';
}

/**
 * Format the change description from an audit event.
 * @param {object} item - The audit event item.
 * @returns {string} The change description string.
 */
function formatChange(item) {
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
 * Format the entity reference from an audit event.
 * @param {object} item - The audit event item.
 * @returns {string} The entity description (e.g. "Moment #42").
 */
function formatEntity(item) {
    return `${item.entityType} #${item.entityId}`;
}

/**
 * Check whether a field name should be ignored in audit change display.
 * @param {string} fieldName - The field name to check.
 * @returns {boolean} True if the field should be ignored.
 */
function isIgnoredField(fieldName) {
    return String(fieldName).toLowerCase() === 'updatedat';
}

/**
 * Encode audit event details as a base64-encoded data attribute.
 * @param {object} item - The audit event item.
 * @returns {string} The base64-encoded JSON payload.
 */
function encodeAuditDetails(item) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(getAuditDetailsPayload(item)))));
}

/**
 * Format a field value for display in audit change details.
 * @param {*} value - The raw field value.
 * @returns {string} The formatted display value.
 */
function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'blank';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}
