import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockGetProject = vi.fn();
const mockGetAuditEvents = vi.fn();
const mockRenderAuditTable = vi.fn();
const mockRenderAuditDetailsModal = vi.fn();
const mockGetAuditDetailsPayload = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ navigate: mockNavigate }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getAuditEvents: mockGetAuditEvents,
    getProject: mockGetProject,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts', () => ({
    renderAuditTable: mockRenderAuditTable,
    renderAuditDetailsModal: mockRenderAuditDetailsModal,
    getAuditDetailsPayload: mockGetAuditDetailsPayload,
}));

describe('loadProjectAuditHistoryPage', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <h1 id="project-title"></h1>
            <span id="error-text"></span>
            <div id="audit-history-list"></div>
            <div id="audit-history-loading"></div>
            <div id="audit-history-pagination"></div>
            <button id="back-to-projects-btn">Back</button>
        `;
        vi.clearAllMocks();
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td></tr></tbody></table>');
        mockRenderAuditDetailsModal.mockReturnValue('<div id="audit-details-modal"><div id="audit-details-modal-title"></div><div id="audit-details-modal-body"></div></div>');
        mockGetAuditDetailsPayload.mockReturnValue({ title: 'Detail', html: '<p>details</p>' });
    });

    it('sets the project title from API', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'My Project' });
        mockGetAuditEvents.mockResolvedValue({ items: [], totalCount: 0 });
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'owner1', 'proj1');
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#project-title')!.textContent).toContain('My Project');
        });
    });

    it('falls back to slug-based title when API fails', async () => {
        // Arrange
        mockGetProject.mockRejectedValue(new Error('fail'));
        mockGetAuditEvents.mockResolvedValue({ items: [], totalCount: 0 });
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'owner1', 'proj1');
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#project-title')!.textContent).toContain('owner1/proj1');
        });
    });

    it('renders audit events in the list', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [{ id: 1, action: 'update' }], totalCount: 1 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>update event</td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('.audit-row')).not.toBeNull();
        });
    });

    it('shows loading indicator while fetching', async () => {
        // Arrange
        let resolveEvents: (value: unknown) => void;
        mockGetAuditEvents.mockReturnValue(new Promise((r) => { resolveEvents = r; }));
        mockGetProject.mockResolvedValue({ name: 'P' });
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        const loading = document.querySelector('#audit-history-loading') as HTMLElement;
        expect(loading.hidden).toBe(false);
        resolveEvents!({ items: [], totalCount: 0 });
        // Assert
        await vi.waitFor(() => {
            expect(loading.hidden).toBe(true);
        });
    });

    it('shows error on failed first load', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockRejectedValue(new Error('fail'));
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#audit-history-list .text-danger') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to load audit history.');
        });
    });

    it('navigates back on back button click', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [], totalCount: 0 });
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act
        loadProjectAuditHistoryPage(navDiv, contentDiv, 'o', 'p');
        await vi.waitFor(() => {
            document.querySelector('#back-to-projects-btn')!.dispatchEvent(new MouseEvent('click'));
            expect(mockNavigate).toHaveBeenCalledWith('/projects', navDiv, contentDiv);
        });
    });

    it('does not throw when DOM elements are missing', async () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        // Act & Assert
        expect(() => loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p')).not.toThrow();
    });
});
