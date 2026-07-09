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

    it('renders pagination with next/previous buttons', async () => {
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [{ id: 1 }], totalCount: 50 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        await vi.waitFor(() => {
            const nextBtn = document.querySelector('[data-page-action="next"]') as HTMLButtonElement;
            expect(nextBtn).not.toBeNull();
            expect(nextBtn.disabled).toBe(false);
        });
    });

    it('navigates to next page on next button click', async () => {
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [{ id: 1 }], totalCount: 50 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        await vi.waitFor(() => {
            const nextBtn = document.querySelector('[data-page-action="next"]') as HTMLButtonElement;
            if (nextBtn) nextBtn.click();
            expect(mockGetAuditEvents).toHaveBeenCalledTimes(2);
        });
    });

    it('navigates to previous page on previous button click', async () => {
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [{ id: 1 }], totalCount: 50 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        await vi.waitFor(() => {
            expect(mockGetAuditEvents).toHaveBeenCalledTimes(1);
        });
        const nextBtn = document.querySelector('[data-page-action="next"]') as HTMLButtonElement;
        nextBtn.click();
        await vi.waitFor(() => {
            expect(mockGetAuditEvents).toHaveBeenCalledTimes(2);
        });
        mockGetAuditEvents.mockResolvedValue({ items: [{ id: 1 }], totalCount: 50 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event - page 2</td></tr></tbody></table>');
        await vi.waitFor(() => {
            const prevBtn = document.querySelector('[data-page-action="previous"]') as HTMLButtonElement;
            expect(prevBtn).not.toBeNull();
            expect(prevBtn.disabled).toBe(false);
            prevBtn.click();
        });
        await vi.waitFor(() => {
            expect(mockGetAuditEvents).toHaveBeenCalledTimes(3);
        });
    });

    it('opens audit details on detail link click', async () => {
        mockGetProject.mockResolvedValue({ name: 'P' });
        const auditItem = { id: 1, action: 'update' };
        mockGetAuditEvents.mockResolvedValue({ items: [auditItem], totalCount: 1 });
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td><td><a href="#" class="audit-show-details-link">Details</a></td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        await vi.waitFor(() => {
            const link = document.querySelector('.audit-show-details-link') as HTMLAnchorElement;
            if (link) link.click();
            const modalTitle = document.querySelector('#audit-details-modal-title') as HTMLElement;
            expect(modalTitle).not.toBeNull();
            expect(modalTitle.textContent).toBe('Detail');
        });
        expect(mockGetAuditDetailsPayload).toHaveBeenCalledWith(auditItem);
    });

    it('shows error on failed subsequent load', async () => {
        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValueOnce({ items: [{ id: 1 }], totalCount: 50 });
        mockGetAuditEvents.mockRejectedValueOnce(new Error('fail'));
        mockRenderAuditTable.mockReturnValue('<table><tbody><tr class="audit-row"><td>event</td></tr></tbody></table>');
        const { loadProjectAuditHistoryPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage(document.createElement('div'), document.createElement('div'), 'o', 'p');
        await vi.waitFor(() => {
            const nextBtn = document.querySelector('[data-page-action="next"]') as HTMLButtonElement;
            expect(nextBtn).not.toBeNull();
            expect(nextBtn.disabled).toBe(false);
        });
        const nextBtn = document.querySelector('[data-page-action="next"]') as HTMLButtonElement;
        nextBtn.click();
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to load more audit history.');
        });
    });
});
