import { describe, it, expect } from 'vitest';

describe('formatTimestamp', () => {
    it('returns "Unknown" for null', async () => {
        // Arrange
        const { formatTimestamp } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const result = formatTimestamp(null);
        // Assert
        expect(result).toBe('Unknown');
    });

    it('returns "Unknown" for undefined', async () => {
        // Arrange
        const { formatTimestamp } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const result = formatTimestamp(undefined);
        // Assert
        expect(result).toBe('Unknown');
    });

    it('returns the raw string for an invalid date string', async () => {
        // Arrange
        const { formatTimestamp } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const result = formatTimestamp('not-a-date');
        // Assert
        expect(result).toBe('not-a-date');
    });

    it('formats a valid date string', async () => {
        // Arrange
        const { formatTimestamp } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const result = formatTimestamp('2024-01-15T10:30:00Z');
        // Assert
        expect(result).toContain('2024');
        expect(result).toContain('01');
        expect(result).toContain('15');
    });

    it('formats a Date object', async () => {
        // Arrange
        const { formatTimestamp } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const result = formatTimestamp(new Date('2024-06-01T12:00:00Z'));
        // Assert
        expect(result).toContain('2024');
    });
});

describe('renderAuditTable', () => {
    it('returns empty state for null items', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const html = renderAuditTable(null);
        // Assert
        expect(html).toContain('No activity recorded yet.');
    });

    it('returns empty state for undefined items', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const html = renderAuditTable(undefined);
        // Assert
        expect(html).toContain('No activity recorded yet.');
    });

    it('returns empty state for empty array', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const html = renderAuditTable([]);
        // Assert
        expect(html).toContain('No activity recorded yet.');
    });

    it('renders a table row for each item', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [
            {
                occurredAtUtc: '2024-01-15T10:30:00Z',
                actorEmail: 'alice@example.com',
                actionType: 'Created',
                entityType: 'Iteration',
                entityId: 1,
            },
            {
                occurredAtUtc: '2024-01-16T11:00:00Z',
                actorEmail: 'bob@example.com',
                actionType: 'StatusChanged',
                changes: [{ fieldName: 'Status', before: 'ToDo', after: 'Done' }],
                entityType: 'Moment',
                entityId: 42,
            },
        ];
        // Act
        const html = renderAuditTable(items);
        // Assert
        expect(html).toContain('alice@example.com');
        expect(html).toContain('bob@example.com');
        expect(html).toContain('Created');
        expect(html).toContain('Status Changed');
        expect(html).toContain('ToDo → Done');
        expect(html).toContain('Iteration #1');
        expect(html).toContain('Moment #42');
    });

    it('renders "Updated" for unknown actionType', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [{
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'user@example.com',
            actionType: 'Renamed',
            changes: [{ fieldName: 'Name', before: 'Old', after: 'New' }],
            entityType: 'Project',
            entityId: 5,
        }];
        // Act
        const html = renderAuditTable(items);
        // Assert
        expect(html).toContain('Updated');
    });

    it('shows "show details" link with encoded payload', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [{
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'a@b.com',
            actionType: 'Created',
            entityType: 'Project',
            entityId: 1,
        }];
        // Act
        const html = renderAuditTable(items);
        // Assert
        expect(html).toContain('audit-show-details-link');
        expect(html).toContain('data-audit-details=');
    });

    it('shows system when no actor info', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [{
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actionType: 'Deleted',
            entityType: 'Moment',
            entityId: 7,
        }];
        // Act
        const html = renderAuditTable(items);
        // Assert
        expect(html).toContain('System');
    });

    it('filters out UpdatedAt changes', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [{
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'a@b.com',
            actionType: 'Updated',
            changes: [
                { fieldName: 'Name', before: 'Old', after: 'New' },
                { fieldName: 'UpdatedAt', before: '2023-01-01', after: '2024-01-01' },
            ],
            entityType: 'Project',
            entityId: 3,
        }];
        // Act
        const html = renderAuditTable(items);
        // Assert
        expect(html).toContain('Name');
        expect(html).not.toContain('UpdatedAt');
    });

    it('renders table with showEntity option', async () => {
        // Arrange
        const { renderAuditTable } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const items = [{
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'a@b.com',
            actionType: 'Created',
            entityType: 'Moment',
            entityId: 9,
        }];
        // Act
        const html = renderAuditTable(items, { showEntity: true });
        // Assert
        expect(html).toContain('Items Affected');
    });
});

describe('renderAuditDetailsModal', () => {
    it('returns modal HTML with correct id', async () => {
        // Arrange
        const { renderAuditDetailsModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        // Act
        const html = renderAuditDetailsModal();
        // Assert
        expect(html).toContain('id="audit-details-modal"');
        expect(html).toContain('Audit details');
    });
});

describe('getAuditDetailsPayload', () => {
    it('returns title and html for an audit item', async () => {
        // Arrange
        const { getAuditDetailsPayload } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const item = {
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'admin@example.com',
            actionType: 'Created',
            entityType: 'Iteration',
            entityId: 5,
        };
        // Act
        const payload = getAuditDetailsPayload(item);
        // Assert
        expect(payload.title).toBe('Created Iteration #5');
        expect(payload.html).toContain('admin@example.com');
        expect(payload.html).toContain('Created');
    });

    it('includes change details in html', async () => {
        // Arrange
        const { getAuditDetailsPayload } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        const item = {
            occurredAtUtc: '2024-01-15T10:30:00Z',
            actorEmail: 'dev@example.com',
            actionType: 'StatusChanged',
            changes: [{ fieldName: 'Status', before: 'ToDo', after: 'InProgress' }],
            entityType: 'Moment',
            entityId: 42,
        };
        // Act
        const payload = getAuditDetailsPayload(item);
        // Assert
        expect(payload.title).toBe('Status Changed Moment #42');
        expect(payload.html).toContain('Status: ToDo → InProgress');
    });
});
