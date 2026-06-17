import { navigate } from '../router.mjs';
import { getAuditEvents, getProject } from './api.ts';
import { getAuditDetailsPayload, renderAuditDetailsModal, renderAuditTable } from './audit.mjs';

const PAGE_SIZE = 25;

/**
 * Load the project audit history page with paginated audit event entries.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
export function loadProjectAuditHistoryPage(navContentDiv, contentDiv, owner, project) {
    const titleEl = document.getElementById('project-title');
    const errorEl = document.getElementById('error-text');
    const listEl = document.getElementById('audit-history-list');
    const loadingEl = document.getElementById('audit-history-loading');
    const paginationEl = document.getElementById('audit-history-pagination');
    const backBtn = document.getElementById('back-to-projects-btn');
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
     * Load the project name and update the page title.
     */
    async function loadProjectName() {
        try {
            const projectData = await getProject(owner, project);
            titleEl.textContent = projectData?.name ? `${projectData.name} activity` : `Project ${owner}/${project} activity`;
        } catch {
            titleEl.textContent = `Project ${owner}/${project} activity`;
        }
    }

    /**
     * Calculate the total number of pagination pages.
     * @returns {number} The total page count.
     */
    function getTotalPages() {
        return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    }

    /**
     * Render the pagination controls based on current page and total pages.
     */
    function renderPagination() {
        const totalPages = getTotalPages();
        const previousDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= totalPages;

        paginationEl.innerHTML = `
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

        paginationEl.querySelectorAll('[data-page-action]').forEach(button => {
            button.addEventListener('click', () => {
                const direction = button.dataset.pageAction;
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
     * Ensure the audit details modal element exists in the DOM.
     */
    function ensureModal() {
        let container = document.getElementById(modalContainerId);
        if (!container) {
            container = document.createElement('div');
            container.id = modalContainerId;
            document.body.appendChild(container);
        }

        container.innerHTML = renderAuditDetailsModal();
    }

    /**
     * Open the audit details modal for a given audit event item.
     * @param {object} item - The audit event data.
     */
    function openAuditDetails(item) {
        const payload = getAuditDetailsPayload(item);
        const titleEl = document.getElementById('audit-details-modal-title');
        const bodyEl = document.getElementById('audit-details-modal-body');
        const modalEl = document.getElementById('audit-details-modal');

        if (!titleEl || !bodyEl || !modalEl) return;

        titleEl.textContent = payload.title;
        bodyEl.innerHTML = payload.html;

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

    /**
     * Load audit history entries for the current page.
     * @param {boolean} [reset=false] - Whether to reset to page 1.
     */
    async function loadEntries(reset = false) {
        if (loading) return;

        loading = true;
        errorEl.textContent = '';

        if (reset) {
            currentPage = 1;
            skip = 0;
            listEl.innerHTML = '';
        }

        loadingEl.hidden = false;
        listEl.hidden = true;

        try {
            skip = (currentPage - 1) * PAGE_SIZE;
            const { items, totalCount: total } = await getAuditEvents(owner, project, PAGE_SIZE, skip);
            totalCount = total;
            listEl.innerHTML = renderAuditTable(items, { showEntity: true });
            bindAuditDetailLinks(items);
            renderPagination();
        } catch (error) {
            if (reset) {
                listEl.innerHTML = '<p class="text-danger mb-0">Failed to load audit history.</p>';
            } else {
                errorEl.textContent = 'Failed to load more audit history.';
            }
            console.warn('Failed to load project audit history page:', error);
        } finally {
            loading = false;
            loadingEl.hidden = true;
            listEl.hidden = false;
        }
    }

    /**
     * Bind click handlers to audit detail links in the rendered table.
     * @param {object[]} items - The audit event items corresponding to each row.
     */
    function bindAuditDetailLinks(items) {
        const detailLinks = listEl.querySelectorAll('.audit-show-details-link');
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