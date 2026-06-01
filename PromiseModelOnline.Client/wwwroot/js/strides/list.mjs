import { navigate } from '../router.mjs';
import { getProjectById } from '../projects/api.mjs';
import {
    getIterationsByProject,
    getStridesByIteration,
    getMomentsByStride,
    getMomentsByIteration,
    getProjectMembers,
    getMyPermission,
    progressStride
} from './api.mjs';

import {
    moveMomentToStride,
    updateMomentStatus,
    updateMomentEstimate,
    updateMomentOwner
} from '../moments/api.mjs';

import { buildGraphViewHref } from '../projects/graph-link.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { formatDate } from '../utils/date.mjs';

/* ---------- T-shirt size to numeric mapping ---------- */
const estimateValues = {
    XS: 1,
    S: 2,
    M: 3,
    L: 5,
    XL: 8,
    XXL: 13,
    XXXL: 21
};

const estimateOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

let cachedMembers = [];
let cachedAllStrides = [];
let cachedCanEdit = false;
let cachedProjectId = null;

/* ---------- Permissions ---------- */
function applyPermissionUI(canEdit) {
    const controls = document.querySelectorAll(
        '.status-dropdown, .estimate-dropdown, .owner-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn'
    );

    controls.forEach(el => {
        el.disabled = !canEdit;
    });

    document.querySelectorAll('.progress-stride-btn').forEach(btn => {
        btn.classList.toggle('hidden', !canEdit);
    });
}

/* ---------- General helpers ---------- */
function preserveScroll(action) {
    const y = window.scrollY;
    const result = action();
    window.scrollTo(0, y);
    return result;
}

function getStrideStartDateValue(stride) {
    const d = new Date(stride?.startDate);
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : 0;
}

function findNextStrideIdInIteration(currentStrideId) {
    const strides = Array.isArray(cachedAllStrides) ? [...cachedAllStrides] : [];
    strides.sort((a, b) => getStrideStartDateValue(a) - getStrideStartDateValue(b));

    const idx = strides.findIndex(s => String(s?.id) === String(currentStrideId));
    if (idx < 0) return null;

    return strides[idx + 1]?.id ?? null;
}

function isRowDone(row) {
    const status = (row?.querySelector?.('.status-dropdown')?.value
        ?? row?.querySelector?.('.status-badge')?.textContent
        ?? '').trim();

    return String(status).toLowerCase() === 'done';
}

function findMomentRow(momentId) {
    return document.querySelector(`tr[data-moment-id="${momentId}"]`);
}

function getMomentStatementById(momentId) {
    const row = findMomentRow(momentId);
    return String(row?.querySelector('td')?.textContent ?? '').trim();
}

function truncateMomentStatement(momentId) {
    const statement = getMomentStatementById(momentId);
    if (!statement) return `moment ${momentId}`;
    return statement.length > 35 ? `${statement.slice(0, 35)}...` : statement;
}

/* ---------- DOM helpers ---------- */
function removeNoItemsPlaceholder(card) {
    const noItems = card?.querySelector?.('.stride-moments .no-items');
    if (noItems) noItems.remove();
}

function ensureNoItemsPlaceholder(card) {
    if (!card) return;

    const momentsContainer = card.querySelector('.stride-moments');
    if (!momentsContainer) return;

    const rowCount = card.querySelectorAll('table.promisemodel-table tbody tr[data-moment-id]').length;
    if (rowCount > 0) return;

    momentsContainer.innerHTML = '<p class="no-items">No moments assigned.</p>';
}

function updateStrideTotalEffortFromDom(card) {
    const totalEl = card?.querySelector?.('.stride-total-effort');
    if (!totalEl) return;

    let total = 0;
    card.querySelectorAll('table.promisemodel-table tbody tr[data-moment-id]').forEach(row => {
        const estimate = row.querySelector('.estimate-dropdown')?.value;
        total += estimateValues[estimate] ?? 0;
    });

    totalEl.textContent = `Total Effort: ${total}`;
}

/* ---------- Progress stride DOM ---------- */
function progressStrideDomUpdate(strideId) {
    const currentCard = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
    if (!currentCard) return { moved: 0, targetVisible: false };

    const nextStrideId = findNextStrideIdInIteration(strideId);
    const targetCard = nextStrideId
        ? document.querySelector(`.stride-card[data-stride-id="${nextStrideId}"]`)
        : null;

    const unfinishedRows = Array.from(currentCard.querySelectorAll('tr[data-moment-id]'))
        .filter(row => !isRowDone(row));

    if (unfinishedRows.length === 0) {
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: 0, targetVisible: Boolean(targetCard) };
    }

    if (!targetCard) {
        unfinishedRows.forEach(row => row.remove());
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: unfinishedRows.length, targetVisible: false };
    }

    removeNoItemsPlaceholder(targetCard);

    const targetTbody = ensureStrideTbody(nextStrideId);
    if (!targetTbody) {
        unfinishedRows.forEach(row => row.remove());
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: unfinishedRows.length, targetVisible: false };
    }

    unfinishedRows.forEach(row => targetTbody.appendChild(row));
    updateStrideTotalEffortFromDom(currentCard);
    updateStrideTotalEffortFromDom(targetCard);
    ensureNoItemsPlaceholder(currentCard);

    return { moved: unfinishedRows.length, targetVisible: true };
}

/* ---------- Select HTML placeholders ---------- */
function estimateDropdownHtml(momentId, currentEstimate) {
    return `<select class="estimate-dropdown form-select form-select-sm" data-moment-id="${momentId}" data-current-estimate="${currentEstimate ?? ''}"></select>`;
}

function ownerDropdownHtml(momentId, ownerId) {
    return `<select class="owner-dropdown form-select form-select-sm" data-moment-id="${momentId}" data-owner-id="${ownerId ?? ''}"></select>`;
}

function statusDropdownHtml(momentId, status) {
    return `<select class="status-dropdown form-select form-select-sm" data-moment-id="${momentId}" data-current-status="${status ?? ''}"></select>`;
}

function updateStatusBadge(row, newStatus) {
    const badge = row?.querySelector('.status-badge');
    if (!badge) return;

    const safeStatus = newStatus ?? '';
    badge.textContent = safeStatus;

    Array.from(badge.classList)
        .filter(c => c.startsWith('status-') && c !== 'status-badge')
        .forEach(c => badge.classList.remove(c));

    badge.classList.add(`status-${String(safeStatus).toLowerCase()}`);
}

/* ---------- Loading / navigation helpers ---------- */
function createLoadingSpinner(message) {
    return `
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(message)}">
                <span class="visually-hidden">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}

function renderStrideScrollspy(strides) {
    const nav = document.getElementById('stride-scrollspy-nav');
    if (!nav) return;

    if (!Array.isArray(strides) || strides.length <= 1) {
        nav.innerHTML = '';
        nav.classList.add('d-none');
        return;
    }

    nav.classList.remove('d-none');
    nav.innerHTML = `
        <div class="position-sticky top-0 bg-body border rounded p-2 shadow-sm">
            <div class="small text-uppercase text-secondary mb-2">Current Strides</div>
            <nav id="stride-scrollspy-links" class="nav nav-pills flex-wrap gap-2"></nav>
        </div>
    `;

    const links = nav.querySelector('#stride-scrollspy-links');

    strides.forEach(stride => {
        const link = document.createElement('a');
        link.className = 'nav-link py-1 px-2';
        link.href = `#stride-card-${stride.id}`;
        link.textContent = stride.name;
        links.appendChild(link);
    });

    const backlogLink = document.createElement('a');
    backlogLink.className = 'nav-link py-1 px-2';
    backlogLink.href = '#backlog-section';
    backlogLink.textContent = 'Backlog';
    links.appendChild(backlogLink);

    const spyApi = window.bootstrap?.ScrollSpy;
    if (spyApi) {
        const spy = spyApi.getOrCreateInstance(document.body, {
            target: '#stride-scrollspy-links',
            offset: 140
        });
        spy?.refresh?.();
    }

    if (nav.dataset.boundScrollspyClick !== '1') {
        nav.dataset.boundScrollspyClick = '1';
        nav.addEventListener('click', event => {
            const link = event.target.closest('a.nav-link');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState({}, '', href);
        });
    }
}

function momentGraphLinkHtml(momentId) {
    const href = buildGraphViewHref(cachedProjectId, `moment-${momentId}`);
    if (!href) return '';

    return `
        <a href="${href}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${momentId}">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Graph View</span>
        </a>
    `;
}

/* ---------- Move confirmation modals ---------- */
function ensureBacklogMoveModal() {
    let modalEl = document.getElementById('move-to-backlog-modal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = 'move-to-backlog-modal';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Move to Backlog?</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-0" id="move-to-backlog-modal-text"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="move-to-backlog-modal-confirm">Move to Backlog</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalEl);
    return modalEl;
}

function promptMoveToBacklog(momentId, onConfirm) {
    const modalEl = ensureBacklogMoveModal();
    const modalText = modalEl.querySelector('#move-to-backlog-modal-text');
    const confirmButton = modalEl.querySelector('#move-to-backlog-modal-confirm');
    if (!modalText || !confirmButton) return;

    modalText.textContent = `Move ${truncateMomentStatement(momentId)} to the Backlog?`;

    const nextButton = confirmButton.cloneNode(true);
    confirmButton.parentElement.replaceChild(nextButton, confirmButton);

    nextButton.addEventListener('click', async () => {
        nextButton.disabled = true;
        try {
            await onConfirm();
            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
        } catch (error) {
            console.error(error);
            alert('Failed to move moment');
        } finally {
            nextButton.disabled = false;
        }
    }, { once: true });

    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
}

function ensureMoveToStrideModal() {
    let modalEl = document.getElementById('move-to-stride-modal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = 'move-to-stride-modal';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Move to Stride?</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-0" id="move-to-stride-modal-text"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="move-to-stride-modal-confirm">Move</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalEl);
    return modalEl;
}

function promptMoveToStride(momentId, strideId, onConfirm) {
    const modalEl = ensureMoveToStrideModal();
    const modalText = modalEl.querySelector('#move-to-stride-modal-text');
    const confirmButton = modalEl.querySelector('#move-to-stride-modal-confirm');
    if (!modalText || !confirmButton) return;

    modalText.textContent = `Move ${truncateMomentStatement(momentId)} to the selected stride?`;

    const nextButton = confirmButton.cloneNode(true);
    confirmButton.parentElement.replaceChild(nextButton, confirmButton);

    nextButton.addEventListener('click', async () => {
        nextButton.disabled = true;
        try {
            await onConfirm();
            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
        } catch (error) {
            console.error(error);
            alert('Failed to move moment');
        } finally {
            nextButton.disabled = false;
        }
    }, { once: true });

    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
}

/* ---------- Backlog / stride table creation ---------- */
function ensureBacklogTbody() {
    const backlogSection = document.getElementById('backlog-section');
    if (!backlogSection) return null;

    let tbody = backlogSection.querySelector('table.promisemodel-table tbody');
    if (tbody) return tbody;

    backlogSection.innerHTML = `
        <h2>Backlog</h2>
        <div class="backlog-card">
            <table class="promisemodel-table">
                <thead>
                    <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;

    return backlogSection.querySelector('table.promisemodel-table tbody');
}

function createBacklogRow(moment) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = moment.id;
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement)}</td>
        <td>${escapeHtml(moment.type)}</td>
        <td><span class="status-badge status-${String(moment.status || '').toLowerCase()}">${escapeHtml(moment.status)}</span></td>
        <td>${moment.effortEstimate ?? '–'}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${moment.id}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${moment.id}" type="button">Move</button>
                ${momentGraphLinkHtml(moment.id)}
                <a href="/moments/${moment.id}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;

    const select = tr.querySelector('.backlog-target-stride');
    populateBacklogStrideSelect(select);

    return tr;
}

function ensureStrideTbody(strideId) {
    const card = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
    if (!card) return null;

    let tbody = card.querySelector('table.promisemodel-table tbody');
    if (tbody) return tbody;

    const container = card.querySelector('.stride-moments');
    if (!container) return null;

    container.innerHTML = `
        <table class="promisemodel-table">
            <thead>
                <tr>
                    <th>Statement</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Effort</th>
                    <th>Owner</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    return card.querySelector('table.promisemodel-table tbody');
}

function createStrideRow(moment) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = moment.id;
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement)}</td>
        <td>${escapeHtml(moment.type)}</td>
        <td><span class="status-badge status-${String(moment.status || '').toLowerCase()}">${escapeHtml(moment.status)}</span></td>
        <td>${estimateDropdownHtml(moment.id, moment.effortEstimate)}</td>
        <td>${ownerDropdownHtml(moment.id, moment.ownerId)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${statusDropdownHtml(moment.id, moment.status)}
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${moment.id}" type="button">Backlog</button>
                ${momentGraphLinkHtml(moment.id)}
                <a href="/moments/${moment.id}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;

    const estimateSelect = tr.querySelector('.estimate-dropdown');
    const ownerSelect = tr.querySelector('.owner-dropdown');
    const statusSelect = tr.querySelector('.status-dropdown');

    if (estimateSelect) populateEstimateSelect(estimateSelect);
    if (statusSelect) populateStatusSelect(statusSelect);
    if (ownerSelect) populateOwnerSelect(ownerSelect);

    return tr;
}

/* ---------- Dropdown population helpers ---------- */
function populateEstimateSelect(select) {
    const estimates = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const current = select.getAttribute('data-current-estimate') || '';
    select.innerHTML = estimates.map(est => `<option value="${est}" ${est === current ? 'selected' : ''}>${est || '–'}</option>`).join('');
}

function populateStatusSelect(select) {
    const statuses = ['Todo', 'InProgress', 'Blocked', 'Done'];
    const current = select.getAttribute('data-current-status') || '';
    select.innerHTML = statuses.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
}

function populateOwnerSelect(select) {
    const members = cachedMembers || [];
    const currentOwnerId = select.getAttribute('data-owner-id') || '';
    let html = '<option value="">Unassigned</option>';
    members.forEach(m => {
        html += `<option value="${m.userId}" ${String(m.userId) === currentOwnerId ? 'selected' : ''}>${escapeHtml(m.userName)}</option>`;
    });
    select.innerHTML = html;
}

function populateBacklogStrideSelect(select) {
    const strides = cachedAllStrides || [];
    let html = '<option value="">Select stride</option>';
    strides.forEach(s => {
        html += `<option value="${s.id}">${escapeHtml(s.name || `Stride ${s.id}`)}</option>`;
    });
    select.innerHTML = html;
}

function populateAllDropdowns(container) {
    if (!container) return;
    container.querySelectorAll('.estimate-dropdown').forEach(populateEstimateSelect);
    container.querySelectorAll('.status-dropdown').forEach(populateStatusSelect);
    container.querySelectorAll('.owner-dropdown').forEach(populateOwnerSelect);
    container.querySelectorAll('.backlog-target-stride').forEach(populateBacklogStrideSelect);
}

/* ---------- Countdown helper ---------- */
function updateCountdowns() {
    const elements = document.querySelectorAll('.stride-countdown');
    elements.forEach(el => {
        const endDate = new Date(el.dataset.endDate);
        if (isNaN(endDate)) return;
        const now = new Date();
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            el.textContent = 'Ended';
        } else if (diffDays === 0) {
            el.textContent = 'Ends today';
        } else {
            el.textContent = `${diffDays} days left`;
        }
    });
}

/* ---------- Event binding ---------- */
function bindInlineMomentControls(root, projectId, navContentDiv, contentDiv) {
    if (!root) return;

    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    root.addEventListener('change', async event => {
        const target = event.target;

        if (target.matches('.status-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const updated = await updateMomentStatus(momentId, target.value);
                const row = findMomentRow(momentId);
                updateStatusBadge(row, updated.status);
            } catch (err) {
                target.value = previous;
                alert('Failed to update status');
                console.error(err);
            }
        }

        if (target.matches('.estimate-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const estimate = target.value === '' ? null : target.value;
                await updateMomentEstimate(momentId, estimate);

                const row = findMomentRow(momentId);
                const card = row ? row.closest('.stride-card') : null;
                if (card) updateStrideTotalEffortFromDom(card);
            } catch (err) {
                target.value = previous;
                alert('Failed to update estimate');
                console.error(err);
            }
        }

        if (target.matches('.owner-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const newOwnerId = target.value ? parseInt(target.value, 10) : null;
                const updated = await updateMomentOwner(momentId, newOwnerId);
                target.value = updated.ownerId ?? '';
            } catch (err) {
                target.value = previous;
                alert('Failed to update owner');
                console.error(err);
            }
        }
    });

    root.addEventListener('click', async event => {
        const viewLink = event.target.closest('a[data-moment-view]');
        if (viewLink) {
            if (event.ctrlKey || event.metaKey || event.button === 1) return;

            event.preventDefault();

            const href = viewLink.getAttribute('href');
            navigate(href, navContentDiv, contentDiv);

            return;
        }

        const btn = event.target.closest(
            '.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn'
        );

        if (!btn) return;

        if (btn.classList.contains('move-to-backlog-btn')) {
            const momentId = parseInt(btn.dataset.momentId, 10);

            promptMoveToBacklog(momentId, async () => {
                const updated = await moveMomentToStride(momentId, null);

                preserveScroll(() => {
                    const row = findMomentRow(momentId);
                    const origCard = row ? row.closest('.stride-card') : null;
                    if (row) row.remove();

                    const tbody = ensureBacklogTbody();
                    if (tbody) {
                        tbody.appendChild(createBacklogRow(updated));
                        applyPermissionUI(cachedCanEdit);
                    }

                    if (origCard) {
                        updateStrideTotalEffortFromDom(origCard);
                        ensureNoItemsPlaceholder(origCard);
                    }
                });
            });
        }

        if (btn.classList.contains('move-to-stride-from-backlog-btn')) {
            const momentId = parseInt(btn.dataset.momentId, 10);
            const row = btn.closest('tr');
            const select = row?.querySelector('.backlog-target-stride');
            const strideId = select ? parseInt(select.value, 10) : null;

            if (!strideId) return;

            promptMoveToStride(momentId, strideId, async () => {
                const updated = await moveMomentToStride(momentId, strideId);

                preserveScroll(() => {
                    findMomentRow(momentId)?.remove();

                    const tbody = ensureStrideTbody(strideId);
                    const targetCard = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);

                    if (tbody) {
                        tbody.appendChild(createStrideRow(updated));
                        applyPermissionUI(cachedCanEdit);
                    }

                    if (targetCard) {
                        updateStrideTotalEffortFromDom(targetCard);
                        removeNoItemsPlaceholder(targetCard);
                    }
                });
            });
        }

        if (btn.classList.contains('progress-stride-btn')) {
            const strideId = parseInt(btn.dataset.strideId, 10);

            if (!confirm('Move all unfinished moments to the next stride?')) return;

            try {
                await progressStride(strideId);

                const successEl = document.getElementById('success-text');
                if (successEl) successEl.textContent = '';

                const { moved, targetVisible } = preserveScroll(() =>
                    progressStrideDomUpdate(strideId)
                );

                if (successEl) {
                    if (moved === 0) {
                        successEl.textContent = 'Stride progressed. No unfinished moments to move.';
                    } else if (targetVisible) {
                        successEl.textContent = `Stride progressed. Moved ${moved} moment(s) to the next stride.`;
                    } else {
                        successEl.textContent = `Stride progressed. Moved ${moved} moment(s) to the next stride (not shown on this page).`;
                    }
                }
            } catch (err) {
                alert('Failed to progress stride');
                console.error(err);
            }
        }
    });
}

function totalEffort(moments) {
    return moments.reduce((sum, m) => sum + (estimateValues[m.effortEstimate] || 0), 0);
}

/* ---------- Main export ---------- */
export function loadStridesList(projectId, navContentDiv, contentDiv) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');
    const errorEl = document.getElementById('error-text');
    const projectTitle = document.getElementById('project-title');

    cachedProjectId = projectId;

    strideBoard.innerHTML = createLoadingSpinner('Loading strides');
    errorEl.textContent = '';
    if (backlogSection) backlogSection.innerHTML = '';

    Promise.all([
        getProjectById(projectId).catch(() => null),
        getIterationsByProject(projectId)
    ])
        .then(([project, iterations]) => {
            if (!iterations || iterations.length === 0) {
                strideBoard.innerHTML = '';
                errorEl.textContent = 'No iterations found for this project.';
                return;
            }

            iterations.sort((a, b) => b.id - a.id);

            const latestIteration = iterations[0];
            const projectName = project?.name ?? `Project ${projectId}`;

            projectTitle.innerHTML = `<h2>${escapeHtml(projectName)} – ${escapeHtml(latestIteration.name)}</h2>`;

            const historyLink = document.getElementById('iteration-history-link');
            if (historyLink) {
                historyLink.addEventListener('click', event => {
                    event.preventDefault();
                    navigate(`/projects/${projectId}/iterations`, navContentDiv, contentDiv);
                });
            }

            return Promise.all([
                getStridesByIteration(latestIteration.id),
                getMomentsByIteration(latestIteration.id, true)
            ]).then(([strides, backlogMoments]) => ({ strides, backlogMoments }));
        })
        .then(data => {
            if (!data) return;

            const { strides, backlogMoments } = data;
            strideBoard.innerHTML = '';

            if (!strides || strides.length === 0) {
                strideBoard.innerHTML = '<p>No strides found for this iteration.</p>';
            } else {
                renderStrideScrollspy(strides);

                const stridePromises = strides.map(stride =>
                    getMomentsByStride(stride.id)
                        .then(moments => ({ stride, moments }))
                        .catch(() => ({ stride, moments: [] }))
                );

                return Promise.all(stridePromises)
                    .then(results => ({ results, backlogMoments, strides }));
            }

            return { results: [], backlogMoments, strides: [] };
        })
        .then(data => {
            if (!data) return;

            const { results, backlogMoments, strides: allStrides } = data;

            results.forEach(({ stride, moments }) => {
                const card = document.createElement('div');
                card.className = 'stride-card';
                card.dataset.strideId = stride.id;
                card.id = `stride-card-${stride.id}`;

                const effTotal = totalEffort(moments);

                card.innerHTML = `
                    <div class="stride-header">
                        <h3>${escapeHtml(stride.name)}</h3>
                        <span class="stride-dates">${formatDate(stride.startDate, '–')} – ${formatDate(stride.endDate, '–')}</span>
                        <span class="stride-duration">(${stride.durationDays} days)</span>
                        <span class="stride-countdown" data-end-date="${stride.endDate}"></span>
                        <span class="stride-total-effort">Total Effort: ${effTotal}</span>
                        <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${stride.id}" type="button">Progress</button>
                    </div>
                    <div class="stride-moments">
                        ${moments.length === 0
                            ? '<p class="no-items">No moments assigned.</p>'
                            : `<table class="promisemodel-table">
                                <thead>
                                    <tr>
                                        <th>Statement</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Effort</th>
                                        <th>Owner</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${moments.map(m => `
                                        <tr data-moment-id="${m.id}">
                                            <td>${escapeHtml(m.statement)}</td>
                                            <td>${escapeHtml(m.type)}</td>
                                            <td><span class="status-badge status-${String(m.status || '').toLowerCase()}">${escapeHtml(m.status)}</span></td>
                                            <td>${estimateDropdownHtml(m.id, m.effortEstimate)}</td>
                                            <td>${ownerDropdownHtml(m.id, m.ownerId)}</td>
                                            <td>
                                                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                    ${statusDropdownHtml(m.id, m.status)}
                                                    <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${m.id}" type="button">Backlog</button>
                                                    ${momentGraphLinkHtml(m.id)}
                                                    <a href="/moments/${m.id}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>`
                        }
                    </div>
                `;

                strideBoard.appendChild(card);
            });

            if (backlogSection) {
                if (!backlogMoments || backlogMoments.length === 0) {
                    backlogSection.innerHTML = '<h2>Backlog</h2><p class="no-items">No unassigned moments.</p>';
                } else {
                    backlogSection.innerHTML = `
                        <h2>Backlog</h2>
                        <div class="backlog-card">
                            <table class="promisemodel-table">
                                <thead>
                                    <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    ${backlogMoments.map(m => `
                                        <tr data-moment-id="${m.id}">
                                            <td>${escapeHtml(m.statement)}</td>
                                            <td>${escapeHtml(m.type)}</td>
                                            <td><span class="status-badge status-${String(m.status || '').toLowerCase()}">${escapeHtml(m.status)}</span></td>
                                            <td>${m.effortEstimate ?? '–'}</td>
                                            <td>
                                                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                    <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${m.id}"></select>
                                                    <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${m.id}" type="button">Move</button>
                                                    ${momentGraphLinkHtml(m.id)}
                                                    <a href="/moments/${m.id}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                    // ✅ REPLACED: populateSelectsWithin -> populateAllDropdowns
                    populateAllDropdowns(backlogSection);
                }
            }

            Promise.all([
                getProjectMembers(projectId),
                getMyPermission(projectId)
            ]).then(([members, level]) => {
                cachedMembers = Array.isArray(members) ? members : [];
                cachedCanEdit = String(level ?? '').trim().toLowerCase() === 'edit';
                applyPermissionUI(cachedCanEdit);
                // Populate all dropdowns now that members and strides are known
                populateAllDropdowns(strideBoard);
                if (backlogSection) populateAllDropdowns(backlogSection);
            }).catch(err => {
                console.error('Failed to load project members/permission', err);
                cachedMembers = [];
                cachedCanEdit = false;
                applyPermissionUI(false);
                populateAllDropdowns(strideBoard);
                if (backlogSection) populateAllDropdowns(backlogSection);
            });

            updateCountdowns();

            cachedAllStrides = Array.isArray(allStrides) ? allStrides : [];
            renderStrideScrollspy(cachedAllStrides);

            document.querySelectorAll('.backlog-target-stride')
                .forEach(select => populateBacklogStrideSelect(select));

            attachPlanningListeners(projectId, navContentDiv, contentDiv);
        })
        .catch(err => {
            strideBoard.innerHTML = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

function attachPlanningListeners(projectId, navContentDiv, contentDiv) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');

    bindInlineMomentControls(strideBoard, projectId, navContentDiv, contentDiv);
    bindInlineMomentControls(backlogSection, projectId, navContentDiv, contentDiv);
}