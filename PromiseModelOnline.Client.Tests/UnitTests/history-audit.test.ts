import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockNavigate = vi.fn();
const mockGetProject = vi.fn();
const mockGetAuditEvents = vi.fn();
const mockRenderAuditTable = vi.fn();
const mockRenderAuditDetailsModal = vi.fn();
const mockGetAuditDetailsPayload = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({
    navigate: mockNavigate,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getProject: mockGetProject,
    getAuditEvents: mockGetAuditEvents,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts', () => ({
    renderAuditTable: mockRenderAuditTable,
    renderAuditDetailsModal: mockRenderAuditDetailsModal,
    getAuditDetailsPayload: mockGetAuditDetailsPayload,
}));

function setupDom() {
    document.body.innerHTML = `
        <div id="project-title"></div>
        <div id="error-text"></div>
        <div id="audit-history-list"></div>
        <div id="audit-history-loading"></div>
        <div id="audit-history-pagination"></div>
        <button id="back-to-projects-btn"></button>
    `;
}

function setupMissingElement(missingId: string) {
    document.body.innerHTML = `<div id="project-title"></div>
        <div id="error-text"></div>
        <div id="audit-history-list"></div>
        <div id="audit-history-loading"></div>
        <div id="audit-history-pagination"></div>
        <button id="back-to-projects-btn"></button>`;
    const el = document.getElementById(missingId);
    if (el) el.remove();
}

function mockAuditItem(index: number) {
    return { id: index, eventType: 'update', summary: `change ${index}` };
}

function mockAuditItems(count: number) {
    return Array.from({ length: count }, (_, i) => mockAuditItem(i + 1));
}

function auditRowHtml(items: unknown[]) {
    if (!items || items.length === 0) {
        return '<div>No activity recorded yet.</div>';
    }
    return `<div class="table-responsive"><table><tbody>
        ${items.map((_, i) => `<tr>
            <td><a href="#" class="audit-show-details-link" data-index="${i}">show details</a></td>
        </tr>`).join('')}
    </tbody></table></div>`;
}

describe('loadProjectAuditHistoryPage', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        expect(mod.loadProjectAuditHistoryPage).toBeDefined();
    });
});

describe('renderAuditTable', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        expect(mod.renderAuditTable ?? mod.loadProjectAudit).toBeDefined();
    });
});

describe('loadProjectAuditHistoryPage behavior', () => {
    let loadProjectAuditHistoryPage: typeof import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts') extends { loadProjectAuditHistoryPage: infer F } ? F : never;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockNavigate.mockReset();
        mockGetProject.mockReset();
        mockGetAuditEvents.mockReset();
        mockRenderAuditTable.mockReset();
        mockRenderAuditDetailsModal.mockReturnValue('<div id="audit-details-modal">modal</div>');
        mockGetAuditDetailsPayload.mockReset();
        document.body.innerHTML = '';
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        loadProjectAuditHistoryPage = mod.loadProjectAuditHistoryPage;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns early when essential DOM elements are missing', () => {
        setupMissingElement('project-title');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'owner', 'project');

        expect(mockGetProject).not.toHaveBeenCalled();
        expect(mockGetAuditEvents).not.toHaveBeenCalled();
    });

    it('loads project title and audit entries on successful load', async () => {
        setupDom();
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        mockGetProject.mockResolvedValue({ name: 'My Project' });
        const items = mockAuditItems(3);
        mockGetAuditEvents.mockResolvedValue({ items, totalCount: 10 });
        mockRenderAuditTable.mockReturnValue(auditRowHtml(items));

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'owner', 'my-project');
        await vi.runAllTimersAsync();

        expect(mockGetProject).toHaveBeenCalledWith('owner', 'my-project');
        expect(mockGetAuditEvents).toHaveBeenCalledWith('owner', 'my-project', 25, 0);
        expect(document.getElementById('project-title')!.textContent).toBe('My Project activity');
        expect(mockRenderAuditTable).toHaveBeenCalled();
    });

    it('renders pagination controls', async () => {
        setupDom();
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        mockGetProject.mockResolvedValue({ name: 'P' });
        const items = mockAuditItems(25);
        mockGetAuditEvents.mockResolvedValue({ items, totalCount: 100 });
        mockRenderAuditTable.mockReturnValue(auditRowHtml(items));

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'o', 'p');
        await vi.runAllTimersAsync();

        const paginationEl = document.getElementById('audit-history-pagination')!;
        expect(paginationEl.querySelector('[data-page-action="previous"]')).toBeTruthy();
        expect(paginationEl.querySelector('[data-page-action="next"]')).toBeTruthy();
        expect(paginationEl.textContent).toContain('Page 1 of 4');
    });

    it('shows "Failed to load audit history" on API error when isReset is true', async () => {
        setupDom();
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockRejectedValue(new Error('API failure'));
        mockRenderAuditTable.mockReturnValue(auditRowHtml([]));

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'o', 'p');
        await vi.runAllTimersAsync();

        const listEl = document.getElementById('audit-history-list')!;
        expect(listEl.querySelector('.text-danger')).toBeTruthy();
        expect(listEl.querySelector('.text-danger')!.textContent).toBe('Failed to load audit history.');
    });

    it('shows "Failed to load more audit history" on subsequent (non-reset) page load error', async () => {
        setupDom();
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        mockGetProject.mockResolvedValue({ name: 'P' });
        const items = mockAuditItems(25);
        mockGetAuditEvents.mockResolvedValueOnce({ items, totalCount: 100 });
        mockRenderAuditTable.mockReturnValue(auditRowHtml(items));
        mockGetAuditEvents.mockRejectedValueOnce(new Error('second page error'));
        mockRenderAuditTable.mockReturnValue(auditRowHtml([]));

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'o', 'p');
        await vi.runAllTimersAsync();

        const paginationEl = document.getElementById('audit-history-pagination')!;
        const nextButton = paginationEl.querySelector<HTMLButtonElement>('[data-page-action="next"]')!;
        expect(nextButton).toBeTruthy();

        nextButton.click();
        await vi.runAllTimersAsync();

        const errorEl = document.getElementById('error-text')!;
        expect(errorEl.textContent).toBe('Failed to load more audit history.');
    });

    it('navigates back to projects when back button is clicked', async () => {
        setupDom();
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');

        mockGetProject.mockResolvedValue({ name: 'P' });
        mockGetAuditEvents.mockResolvedValue({ items: [], totalCount: 0 });
        mockRenderAuditTable.mockReturnValue(auditRowHtml([]));

        loadProjectAuditHistoryPage(navDiv, contentDiv, 'o', 'p');
        await vi.runAllTimersAsync();

        document.getElementById('back-to-projects-btn')!.click();

        expect(mockNavigate).toHaveBeenCalledWith('/projects', navDiv, contentDiv);
    });
});
