// @ts-nocheck
import { navigate } from '../router.ts';

import { getAuditEvents, getProject } from './api.ts';
import { getAuditDetailsPayload, renderAuditDetailsModal, renderAuditTable } from './audit.ts';

const PAGE_SIZE = 25;

/**
 * Load the project audit history page with paginated audit event table and detail modals.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
export function loadProjectAuditHistoryPage(navContentDiv: HTMLElement, contentDiv: HTMLElement, owner: string, project: string): void {
    const titleElement = document.querySelector('#project-title') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const listElement = document.querySelector('#audit-history-list') as HTMLElement | null;
    const loadingElement = document.querySelector('#audit-history-loading') as HTMLElement | null;
    const paginationElement = document.querySelector('#audit-history-pagination') as HTMLElement | null;
    const backButton = document.querySelector('#back-to-projects-btn') as HTMLElement | null;
    if (!titleElement || !errorElement || !listElement || !loadingElement || !paginationElement || !backButton) {
        return;
    }

    const modalContainerId = 'project-history-audit-modal-container';
    let currentPage = 1;
    let skip = 0;
    let isLoading = false;

    let totalCount = 0;

    ensureModal();

    /**
     * Load the project name from the API and set the page title.
     * @returns {Promise<void>}
     */
    async function loadProjectName(): Promise<void> {
        try {
            const projectData = await getProject(owner, project);
            titleElement.textContent = projectData?.name ? `${projectData.name} activity` : `Project ${owner}/${project} activity`;
        } catch {
            titleElement.textContent = `Project ${owner}/${project} activity`;
        }
    }

    /**
     * Get the total number of pagination pages.
     * @returns {number} The total page count.
     */
    function getTotalPages(): number {
        return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    }

    /**
     * Render the pagination controls for the audit history table.
     */
    function renderPagination(): void {
        const totalPages = getTotalPages();
        const isPreviousDisabled = currentPage <= 1;
        const isNextDisabled = currentPage >= totalPages;

        paginationElement!.innerHTML = `
            <nav aria-label="Audit history pages">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item ${isPreviousDisabled ? 'disabled' : ''}">
                        <button class="page-link" type="button" data-page-action="previous" ${isPreviousDisabled ? 'disabled' : ''}>Previous</button>
                    </li>
                    <li class="page-item active" aria-current="page">
                        <span class="page-link">Page ${currentPage} of ${totalPages}</span>
                    </li>
                    <li class="page-item ${isNextDisabled ? 'disabled' : ''}">
                        <button class="page-link" type="button" data-page-action="next" ${isNextDisabled ? 'disabled' : ''}>Next</button>
                    </li>
                </ul>
            </nav>
        `;

        for (const button of paginationElement!.querySelectorAll('[data-page-action]')) {
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
        }
    }

    /**
     * Ensure the audit details modal container exists in the DOM.
     */
    function ensureModal(): void {
        let container = document.querySelector(`#${CSS.escape(modalContainerId)}`);
        if (!container) {
            container = document.createElement('div');
            container.id = modalContainerId;
            document.body.append(container);
        }

        container.innerHTML = renderAuditDetailsModal();
    }

    /**
     * Open the audit details modal for a given audit event.
     * @param {object} item - The audit event item.
     */
    function openAuditDetails(item: unknown): void {
        const payload = getAuditDetailsPayload(item as Parameters<typeof getAuditDetailsPayload>[0]);
        const titleElement = document.querySelector('#audit-details-modal-title') as HTMLElement | null;
        const bodyElement = document.querySelector('#audit-details-modal-body') as HTMLElement | null;
        const modalElement = document.querySelector('#audit-details-modal') as HTMLElement | null;

        if (!titleElement || !bodyElement || !modalElement) return;

        titleElement.textContent = payload.title;
        bodyElement.innerHTML = payload.html;

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalElement).show();
        }
    }

    /**
     * Load a page of audit entries from the API and render them.
     * @param {boolean} [isReset] - Whether to reset to page 1.
     * @returns {Promise<void>}
     */
    async function loadEntries(isReset = false): Promise<void> {
        if (isLoading) return;

        isLoading = true;
        errorElement!.textContent = '';

        if (isReset) {
            currentPage = 1;
            skip = 0;
            listElement!.innerHTML = '';
        }

        loadingElement!.hidden = false;
        listElement!.hidden = true;

        try {
            skip = (currentPage - 1) * PAGE_SIZE;
            const { items, totalCount: total } = await getAuditEvents(owner, project, PAGE_SIZE, skip);
            totalCount = total;
            listElement!.innerHTML = renderAuditTable(items, { showEntity: true });
            bindAuditDetailLinks(items);
            renderPagination();
        } catch (error) {
        if (isReset) {
                listElement!.innerHTML = '<p class="text-danger mb-0">Failed to load audit history.</p>';
            } else {
                errorElement!.textContent = 'Failed to load more audit history.';
            }
            console.warn('Failed to load project audit history page:', error);
        } finally {
            isLoading = false;
            loadingElement!.hidden = true;
            listElement!.hidden = false;
        }
    }

    /**
     * Bind click handlers to audit detail view links.
     * @param {object[]} items - The audit event items.
     */
    function bindAuditDetailLinks(items: unknown[]): void {
        const detailLinks = listElement!.querySelectorAll('.audit-show-details-link');
        let linkIndex = 0;
        for (const link of detailLinks) {
            const currentIndex = linkIndex;
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openAuditDetails(items[currentIndex]);
            });
            linkIndex++;
        }
    }

    (async () => {
        await loadProjectName();
        loadEntries(true);
    })();

    backButton.addEventListener('click', () => {
        navigate('/projects', navContentDiv, contentDiv);
    });
}
