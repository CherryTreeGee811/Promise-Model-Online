import { routeHandler } from '../router.mjs';
import { getProjectById } from '../projects/api.mjs';
import { getIterationsByProject, getStridesByIteration, getMomentsByStride, getMomentsByIteration, getProjectMembers, getMyPermission, progressStride } from './api.mjs';
import { moveMomentToStride, updateMomentStatus, updateMomentEstimate, updateMomentOwner } from '../moments/api.mjs';
import { buildGraphViewHref } from '../projects/graph-link.mjs';

/* ---------- T‑shirt size to numeric mapping ---------- */
const estimateValues = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

let cachedMembers = [];
let cachedAllStrides = [];
let cachedCanEdit = false;
let cachedProjectId = null;

function applyPermissionUI(canEdit) {
    const controls = document.querySelectorAll(
        '.status-dropdown, .estimate-dropdown, .owner-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn'
    );

    controls.forEach(el => el.disabled = !canEdit);

    document.querySelectorAll('.progress-stride-btn')
    .forEach(btn => {
        if (canEdit) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    });
}

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
    const next = strides[idx + 1];
    return next?.id ?? null;
}

function isRowDone(row) {
    const status = (row?.querySelector?.('.status-dropdown')?.value
        ?? row?.querySelector?.('.status-badge')?.textContent
        ?? '').trim();
    return status === 'Done';
}

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

    // If there is a table but no rows, show the empty state.
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

function progressStrideDomUpdate(strideId) {
    const currentCard = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
    if (!currentCard) return { moved: 0, targetVisible: false };

    const nextStrideId = findNextStrideIdInIteration(strideId);
    const targetCard = nextStrideId ? document.querySelector(`.stride-card[data-stride-id="${nextStrideId}"]`) : null;

    const unfinishedRows = Array.from(currentCard.querySelectorAll('tr[data-moment-id]'))
        .filter(row => !isRowDone(row));

    if (unfinishedRows.length === 0) {
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: 0, targetVisible: Boolean(targetCard) };
    }

    // If the next stride card isn't visible on this page (e.g., next iteration),
    // we can still remove rows from the current stride to reflect the backend move.
    if (!targetCard) {
        unfinishedRows.forEach(r => r.remove());
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: unfinishedRows.length, targetVisible: false };
    }

    removeNoItemsPlaceholder(targetCard);
    const targetTbody = ensureStrideTbody(nextStrideId);
    if (!targetTbody) {
        unfinishedRows.forEach(r => r.remove());
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

function estimateDropdownHtml(momentId, currentEstimate) {
    // Return an empty select placeholder; options will be created via DOM to preserve state.
    return `<select class="estimate-dropdown" data-moment-id="${momentId}" data-current-estimate="${currentEstimate ?? ''}"></select>`;
}

function ownerDropdownHtml(momentId, ownerId) {
    return `<select class="owner-dropdown" data-moment-id="${momentId}" data-owner-id="${ownerId ?? ''}"></select>`;
}

function statusDropdownHtml(momentId, status) {
    return `<select class="status-dropdown" data-moment-id="${momentId}" data-current-status="${status ?? ''}"></select>`;
}

function updateStatusBadge(row, newStatus) {
    const badge = row?.querySelector('.status-badge');
    if (!badge) return;

    const safeStatus = newStatus ?? '';
    badge.textContent = safeStatus;

    // Replace any existing status-* class.
    const classes = Array.from(badge.classList);
    classes.filter(c => c.startsWith('status-') && c !== 'status-badge').forEach(c => badge.classList.remove(c));
    badge.classList.add(`status-${String(safeStatus).toLowerCase()}`);
}

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
    strides.forEach((stride, index) => {
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
            offset: 140,
        });
        spy?.refresh?.();
    }

    if (nav.dataset.boundScrollspyClick !== '1') {
        nav.dataset.boundScrollspyClick = '1';
        nav.addEventListener('click', (event) => {
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

function truncateMomentStatement(momentId) {
    const row = findMomentRow(momentId);
    const statementCell = row?.querySelector('td');
    const statement = String(statementCell?.textContent ?? '').trim();
    if (!statement) return `moment ${momentId}`;
    return statement.slice(0, 35);
}

function findMomentRow(momentId) {
    return document.querySelector(`tr[data-moment-id="${momentId}"]`);
}

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

function backlogStrideOptionsHtml() {
    // Prefer cloning from existing backlog selects to avoid depending on cachedAllStrides.
    const existing = document.querySelector('.backlog-target-stride');
    if (existing) return existing.innerHTML;
    // We'll populate backlog selects via DOM methods; return empty placeholder.
    return '';
}

function createBacklogRow(moment) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = moment.id;
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement)}</td>
        <td>${moment.type}</td>
        <td><span class="status-badge status-${(moment.status || '').toLowerCase()}">${moment.status}</span></td>
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
        <td>${moment.type}</td>
        <td><span class="status-badge status-${(moment.status || '').toLowerCase()}">${moment.status}</span></td>
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
    // Populate the selects using DOM methods to avoid innerHTML option rebuilding.
    const estimateSelect = tr.querySelector('.estimate-dropdown');
    const ownerSelect = tr.querySelector('.owner-dropdown');
    const statusSelect = tr.querySelector('.status-dropdown');

    if (estimateSelect) populateEstimateSelect(estimateSelect);
    if (statusSelect) populateStatusSelect(statusSelect);
    if (ownerSelect) {
        // data-owner-id already set in the placeholder markup; populate will pick it up.
        populateOwnerSelect(ownerSelect);
    }
    return tr;
}

function bindInlineMomentControls(root, projectId, navContentDiv, contentDiv) {
    if (!root) return;

    // Prevent double binding ON ROOT (not elements)
    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    root.addEventListener('change', async (e) => {
        const target = e.target;

        // ✅ STATUS
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
            }
        }

        // ✅ ESTIMATE
        if (target.matches('.estimate-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const estimate = target.value === '' ? null : target.value;
                await updateMomentEstimate(momentId, estimate);
                // Recalculate totals for the containing stride card immediately
                const row = findMomentRow(momentId);
                const card = row ? row.closest('.stride-card') : null;
                if (card) updateStrideTotalEffortFromDom(card);
            } catch (err) {
                target.value = previous;
                alert('Failed to update estimate');
            }
        }

        // ✅ OWNER
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
            }
        }
    });

    root.addEventListener('click', async (e) => {
        // ✅ Handle View navigation (NO REFRESH)
        const viewLink = e.target.closest('a[data-moment-view]');
        if (viewLink) {
            e.preventDefault();

            const href = viewLink.getAttribute('href');
            window.history.pushState({}, '', href);
            routeHandler(navContentDiv, contentDiv);

            return;
        }

        const btn = e.target.closest(
            '.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn'
        );

        if (!btn) return;

        // ✅ Move to Backlog
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

        // ✅ Move to Stride
        if (btn.classList.contains('move-to-stride-from-backlog-btn')) {
            const momentId = parseInt(btn.dataset.momentId, 10);
            const row = btn.closest('tr');
            const select = row?.querySelector('.backlog-target-stride');
            const strideId = select ? parseInt(select.value, 10) : null;

            if (!strideId) return;
            promptMoveToStride(momentId, strideId, async () => {
                const updated = await moveMomentToStride(momentId, strideId);
                preserveScroll(() => {
                    // Remove backlog row
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

        // ✅ Progress Stride
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
            } catch {
                alert('Failed to progress stride');
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
                historyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', `/projects/${projectId}/iterations`);
                    routeHandler(navContentDiv, contentDiv);
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
                return Promise.all(stridePromises).then(results => ({ results, backlogMoments, strides }));
            }
            return { results: [], backlogMoments, strides: [] };
        })
        .then(data => {
            if (!data) return;
            const { results, backlogMoments, strides: allStrides } = data;

            // Render stride cards
            results.forEach(({ stride, moments }) => {
                const card = document.createElement('div');
                card.className = 'stride-card';
                card.dataset.strideId = stride.id;
                card.id = `stride-card-${stride.id}`;
                const effTotal = totalEffort(moments);
                card.innerHTML = `
                    <div class="stride-header">
                        <h3>${escapeHtml(stride.name)}</h3>
                        <span class="stride-dates">${formatDate(stride.startDate)} – ${formatDate(stride.endDate)}</span>
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
                                            <td>${m.type}</td>
                                            <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                            <td>
                                                <select class="estimate-dropdown" data-moment-id="${m.id}" data-current-estimate="${m.effortEstimate ?? ''}"></select>
                                            </td>
                                            <td>
                                                <select class="owner-dropdown" data-moment-id="${m.id}" data-owner-id="${m.ownerId ?? ''}"></select>
                                            </td>
                                            <td>
                                                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                    <select class="status-dropdown form-select form-select-sm" data-moment-id="${m.id}" data-current-status="${m.status ?? ''}"></select>
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
                // Populate dropdowns inside the newly created card using DOM option creation
                populateSelectsWithin(card);
            });
            

            // Render Backlog
            if (backlogSection) {
                if (!backlogMoments || backlogMoments.length === 0) {
                    backlogSection.innerHTML = '<h2>Backlog</h2><p class="no-items">No unassigned moments.</p>';
                } else {
                    backlogSection.innerHTML = `<h2>Backlog</h2><div class="backlog-card"><table class="promisemodel-table"><thead><tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead><tbody>
                        ${backlogMoments.map(m => `
                            <tr data-moment-id="${m.id}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td>
                                    <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                        <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${m.id}"></select>
                                        <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${m.id}" type="button">Move</button>
                                        ${momentGraphLinkHtml(m.id)}
                                        <a href="/moments/${m.id}" moment-id="${m.id}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody></table></div>`;
                    // Populate backlog stride selects
                    populateSelectsWithin(backlogSection);
                }
            }

            // Load project members and populate owner dropdowns
            getProjectMembers(projectId)
                .then(members => {
                    cachedMembers = Array.isArray(members) ? members : [];
                    // Populate all owner dropdowns now that we have members
                    document.querySelectorAll('.owner-dropdown').forEach(dropdown => populateOwnerSelect(dropdown));
                })
                .catch(err => console.error('Failed to load project members', err));
                
            // Fetch permission and update UI
            getMyPermission(projectId)
                .then(level => {
                    cachedCanEdit = (level && level.toLowerCase() === 'edit');

                    applyPermissionUI(cachedCanEdit); // ✅ SINGLE source of truth
                })
                .catch(err => console.error('Failed to get permission', err));


            // Update countdowns
            updateCountdowns();

            // Cache stride list for backlog move dropdowns (no refetch needed for later DOM inserts)
            cachedAllStrides = Array.isArray(allStrides) ? allStrides : [];
            renderStrideScrollspy(cachedAllStrides);
            // Ensure any backlog selects reflect the cached strides
            document.querySelectorAll('.backlog-target-stride').forEach(s => populateBacklogStrideSelect(s));

            // Attach planning event listeners (inline updates only; no full reload)
            attachPlanningListeners(projectId, navContentDiv, contentDiv);
        })
        .catch(err => {
            strideBoard.innerHTML = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

/* ---------- Event listeners ---------- */
function attachPlanningListeners(projectId, navContentDiv, contentDiv) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');

    bindInlineMomentControls(strideBoard, projectId, navContentDiv, contentDiv);
    bindInlineMomentControls(backlogSection, projectId, navContentDiv, contentDiv);
}

/* ---------- Burndown drawing ---------- */
function drawBurndownChart(canvas, points) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 30;

    ctx.clearRect(0, 0, w, h);

    const maxEffort = Math.max(...points.map(p => Math.max(p.remainingEffort, p.idealRemaining)), 1);

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Ideal line (dashed)
    ctx.beginPath();
    ctx.strokeStyle = '#3498db';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.idealRemaining / maxEffort) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual line
    ctx.beginPath();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.remainingEffort / maxEffort) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    const firstDate = points[0]?.date ? new Date(points[0].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    const lastDate = points[points.length - 1]?.date ? new Date(points[points.length - 1].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    ctx.fillText(firstDate, pad, h - pad + 15);
    ctx.fillText(lastDate, w - pad - 40, h - pad + 15);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Effort', -h / 2, 15);
    ctx.restore();
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

// Create DOM option element
function createOption(value, text, selected) {
    const opt = document.createElement('option');
    opt.value = String(value ?? '');
    opt.textContent = text ?? '';
    if (selected) opt.selected = true;
    return opt;
}

const estimateOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function populateEstimateSelect(select) {
    if (!select) return;
    const current = select.getAttribute('data-current-estimate') || select.value || '';
    select.innerHTML = '';
    select.appendChild(createOption('', '–', current === ''));
    estimateOrder.forEach(k => select.appendChild(createOption(k, k, String(current) === String(k))));
}

function populateStatusSelect(select) {
    if (!select) return;
    const current = select.getAttribute('data-current-status') || select.value || '';
    select.innerHTML = '';
    select.appendChild(createOption('Todo', 'Todo', current === 'Todo'));
    select.appendChild(createOption('InProgress', 'InProgress', current === 'InProgress'));
    select.appendChild(createOption('Blocked', 'Blocked', current === 'Blocked'));
    select.appendChild(createOption('Done', 'Done', current === 'Done'));
}

function populateOwnerSelect(select) {
    if (!select) return;
    const prev = select.value || select.getAttribute('data-owner-id') || '';
    select.innerHTML = '';
    select.appendChild(createOption('', 'Unassigned', prev === ''));
    (cachedMembers || []).forEach(m => select.appendChild(createOption(String(m.userId), m.userName, String(prev) === String(m.userId))));
    // If previous isn't valid, ensure default
    if (![...select.options].some(o => o.value === String(prev))) {
        select.value = '';
    }
}

function populateBacklogStrideSelect(select) {
    if (!select) return;
    const prev = select.value || '';
    select.innerHTML = '';
    (cachedAllStrides || []).forEach(s => select.appendChild(createOption(String(s.id), s.name, String(prev) === String(s.id))));
    if (![...select.options].some(o => o.value === String(prev))) select.value = (select.options[0] && select.options[0].value) || '';
}

function populateSelectsWithin(root) {
    if (!root) return;
    root.querySelectorAll('.estimate-dropdown').forEach(populateEstimateSelect);
    root.querySelectorAll('.status-dropdown').forEach(populateStatusSelect);
    root.querySelectorAll('.owner-dropdown').forEach(populateOwnerSelect);
    root.querySelectorAll('.backlog-target-stride').forEach(populateBacklogStrideSelect);
}

function getMomentStatementById(momentId) {
    const row = findMomentRow(momentId);
    return String(row?.querySelector('td')?.textContent ?? '').trim();
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateCountdowns() {
    document.querySelectorAll('.stride-countdown').forEach(el => {
        const endDate = new Date(el.dataset.endDate);
        const now = new Date();
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            el.textContent = 'Ended';
            el.style.color = '#e74c3c';
        } else if (diffDays === 0) {
            el.textContent = 'Ends today';
            el.style.color = '#e67e22';
        } else if (diffDays <= 3) {
            el.textContent = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
            el.style.color = '#e67e22';
        } else {
            el.textContent = `${diffDays} days left`;
            el.style.color = '#2ecc71';
        }
    });
}