import { routeHandler } from '../router.mjs';
import { getProjectAuditHistory, getProjectById } from './api.mjs';
import { getAuditDetailsPayload, renderAuditDetailsModal, renderAuditTable } from './audit.mjs';

const PAGE_SIZE = 25;

export function loadProjectAuditHistoryPage(navContentDiv, contentDiv, projectId) {
    const titleEl = document.getElementById('project-title');
    const errorEl = document.getElementById('error-text');
    const listEl = document.getElementById('audit-history-list');
    const loadingEl = document.getElementById('audit-history-loading');
    const paginationEl = document.getElementById('audit-history-pagination');
    const backBtn = document.getElementById('back-to-project-settings-btn');
    const modalContainerId = 'project-history-audit-modal-container';

    let currentPage = 1;
    let skip = 0;
    let loading = false;
    let totalCount = 0;

    if (!titleEl || !errorEl || !listEl || !loadingEl || !paginationEl || !backBtn) {
        return;
    }

    ensureModal();

    async function loadProject() {
        try {
            const project = await getProjectById(projectId);
            titleEl.textContent = project?.name ? `${project.name} activity` : `Project ${projectId} activity`;
        } catch {
            titleEl.textContent = `Project ${projectId} activity`;
        }
    }

    function getTotalPages() {
        return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    }

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

    function ensureModal() {
        let container = document.getElementById(modalContainerId);
        if (!container) {
            container = document.createElement('div');
            container.id = modalContainerId;
            document.body.appendChild(container);
        }

        container.innerHTML = renderAuditDetailsModal();
    }

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
            const { items, totalCount: total } = await getProjectAuditHistory(projectId, PAGE_SIZE, skip);
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

    function bindAuditDetailLinks(items) {
        const detailLinks = listEl.querySelectorAll('.audit-show-details-link');
        detailLinks.forEach((link, index) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openAuditDetails(items[index]);
            });
        });
    }

    loadProject().then(() => loadEntries(true));

    backBtn.addEventListener('click', () => {
        window.history.pushState({}, '', `/projects/${projectId}/settings`);
        routeHandler(navContentDiv, contentDiv);
    });
}