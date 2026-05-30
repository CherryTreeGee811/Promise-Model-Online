export function renderAuditTable(items, { showEntity = false } = {}) {
    if (!items || items.length === 0) {
        return '<p class="text-muted mb-0">No activity recorded yet.</p>';
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

export function renderAuditLoading(message = 'Loading activity') {
    return `
        <div class="d-flex justify-content-center align-items-center py-4" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(message)}">
                <span class="visually-hidden">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}

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

export function formatAuditDetailsTitle(item) {
    return `${formatEventType(item)} ${formatEntity(item)}`;
}

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

export function getAuditDetailsPayload(item) {
    return {
        title: formatAuditDetailsTitle(item),
        html: formatAuditDetailsHtml(item),
    };
}

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

function formatActor(item) {
    return item.actorEmail || item.actorSubject || item.actorUserId || 'System';
}

function formatEventType(item) {
    if (item.actionType === 'StatusChanged') return 'Status Changed';
    if (item.actionType === 'Created') return 'Created';
    if (item.actionType === 'Deleted') return 'Deleted';
    return 'Updated';
}

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

function formatEntity(item) {
    return `${item.entityType} #${item.entityId}`;
}

function isIgnoredField(fieldName) {
    return String(fieldName).toLowerCase() === 'updatedat';
}

function encodeAuditDetails(item) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(getAuditDetailsPayload(item)))));
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'blank';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}