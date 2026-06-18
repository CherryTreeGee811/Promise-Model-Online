// @ts-nocheck
import { navigate } from '../router.ts';

import { getAuditEvents, getProject } from './api.ts';
import { getAuditDetailsPayload, renderAuditDetailsModal, renderAuditTable } from './audit.ts';

const PAGE_SIZE = 25;

/**
 * Load the project audit history page with paginated audit event table and detail modals.
 * @param navContentDiv - The navigation content container.
 * @param contentDiv - The main content container.
 * @param owner - The project owner's slug.
 * @param project - The project's slug.
 */
export function loadProjectAuditHistoryPage(navContentDiv: HTMLElement, contentDiv: HTMLElement, owner: string, project: string): void {
    const titleEl = document.getElementById('project-title') as HTMLElement | null;
    const errorEl = document.getElementById('error-text') as HTMLElement | null;
    const listEl = document.getElementById('audit-history-list') as HTMLElement | null;
    const loadingEl = document.getElementById('audit-history-loading') as HTMLElement | null;
    const paginationEl = document.getElementById('audit-history-pagination') as HTMLElement | null;
    const backBtn = document.getElementById('back-to-projects-btn') as HTMLElement | null;
    const modalContainerId = 'project-history-audit-modal-container';

    let currentPage = 1;
    let skip = 0;
    let loading = false;
    let totalCount = 0;

    if (!titleEl || !errorEl || !listEl || !loadingEl || !paginationEl || !backBtn) {
        return;
    }

    ensureModal();

    /**
     *
     */
    async function loadProjectName(): Promise<void> {
        try {
            const projectData = await getProject(owner, project);
            titleEl.textContent = projectData?.name ? `${projectData.name} activity` : `Project ${owner}/${project} activity`;
        } catch {
            titleEl.textContent = `Project ${owner}/${project} activity`;
        }
    }

    /**
     *
     */
    function getTotalPages(): number {
        return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    }

    /**
     *
     */
    function renderPagination(): void {
        const totalPages = getTotalPages();
        const previousDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= totalPages;

        paginationEl!.innerHTML = `
            <nav aria-label="Audit history pages">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item ${previousDisabled ? 'disabled' : ''}">
                        <button class="page-link" type="button" data-page-action="previous" ${previousDisabled ? 'disabled' : ''}>Previous</button>
                    </li>
                    <li class="page-item active" aria-current="page">
                        <span class="page-link">Page ${currentPage} of ${totalPages}</span>
                    </li>
                    <li class="page-item ${nextDisabled ? 'disabled' : ''}">
                        <button class="page-link" type="button" data-page-action="next" ${nextDisabled ? 'disabled' : ''}>Next</button>
                    </li>
                </ul>
            </nav>
        `;

        paginationEl!.querySelectorAll('[data-page-action]').forEach(button => {
            button.addEventListener('click', () => {
                const direction = (button as HTMLElement).dataset.pageAction;
                if (direction === 'previous' && currentPage > 1) {
                    currentPage -= 1;
                    loadEntries();
                }
                if (direction === 'next' && currentPage < totalPages) {
                    currentPage += 1;
                    loadEntries();
                }
            });
        });
    }

    /**
     *
     */
    function ensureModal(): void {
        let container = document.getElementById(modalContainerId);
        if (!container) {
            container = document.createElement('div');
            container.id = modalContainerId;
            document.body.appendChild(container);
        }

        container.innerHTML = renderAuditDetailsModal();
    }

    /**
     *
     * @param item
     */
    function openAuditDetails(item: unknown): void {
        const payload = getAuditDetailsPayload(item as Parameters<typeof getAuditDetailsPayload>[0]);
        const titleEl = document.getElementById('audit-details-modal-title') as HTMLElement | null;
        const bodyEl = document.getElementById('audit-details-modal-body') as HTMLElement | null;
        const modalEl = document.getElementById('audit-details-modal') as HTMLElement | null;

        if (!titleEl || !bodyEl || !modalEl) return;

        titleEl.textContent = payload.title;
        bodyEl.innerHTML = payload.html;

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

    /**
     *
     * @param reset
     */
    async function loadEntries(reset = false): Promise<void> {
        if (loading) return;

        loading = true;
        errorEl!.textContent = '';

        if (reset) {
            currentPage = 1;
            skip = 0;
            listEl!.innerHTML = '';
        }

        loadingEl!.hidden = false;
        listEl!.hidden = true;

        try {
            skip = (currentPage - 1) * PAGE_SIZE;
            const { items, totalCount: total } = await getAuditEvents(owner, project, PAGE_SIZE, skip);
            totalCount = total;
            listEl!.innerHTML = renderAuditTable(items, { showEntity: true });
            bindAuditDetailLinks(items);
            renderPagination();
        } catch (error) {
            if (reset) {
                listEl!.innerHTML = '<p class="text-danger mb-0">Failed to load audit history.</p>';
            } else {
                errorEl!.textContent = 'Failed to load more audit history.';
            }
            console.warn('Failed to load project audit history page:', error);
        } finally {
            loading = false;
            loadingEl!.hidden = true;
            listEl!.hidden = false;
        }
    }

    /**
     *
     * @param items
     */
    function bindAuditDetailLinks(items: unknown[]): void {
        const detailLinks = listEl!.querySelectorAll('.audit-show-details-link');
        detailLinks.forEach((link, index) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openAuditDetails(items[index]);
            });
        });
    }

    loadProjectName().then(() => loadEntries(true));

    backBtn.addEventListener('click', () => {
        navigate('/projects', navContentDiv, contentDiv);
    });
}
