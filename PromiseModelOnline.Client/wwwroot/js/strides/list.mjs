import { navigate } from '../router.mjs';
import { getProject } from '../projects/api.mjs';
import { getIterations, getStridesByIteration, getMomentsByStride, getMomentsByIteration, getProjectMembers, getMyPermission, progressStride } from './api.mjs';
import { assignMomentToStride, updateMomentStatus, updateMomentEstimate, updateMomentOwner, updateMomentType } from '../moments/api.mjs';
import { buildGraphViewHref } from '../projects/graph-link.mjs';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';
import { openIterationCreateModal } from '../utils/iteration-create-modal.mjs';
import { openStrideCreateModal } from '../utils/stride-create-modal.mjs';
import { STATUS_OPTIONS } from '../utils/status-utils.mjs';

/* ---------- T‑shirt size to numeric mapping ---------- */
const estimateValues = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

let cachedMembers = [];
let cachedAllStrides = [];
let cachedIterations = [];
let cachedCanEdit = false;
let cachedOwner = null;
let cachedProject = null;
let strideStickySyncBound = false;

/**
 * Enable or disable UI controls based on the user's edit permission.
 * @param {boolean} canEdit - Whether the user has edit permission.
 */
function applyPermissionUI(canEdit) {
    const controls = document.querySelectorAll(
        '.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn'
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

/**
 * Execute an action while preserving the current scroll position.
 * @param {Function} action - The action to execute.
 * @returns {*} The return value of the action.
 */
function preserveScroll(action) {
    const y = window.scrollY;
    const result = action();
    window.scrollTo(0, y);
    return result;
}

/**
 * Get the numeric timestamp of a stride's start date.
 * @param {Object} stride - The stride object.
 * @returns {number} The start date timestamp, or 0 if invalid.
 */
function getStrideStartDateValue(stride) {
    const d = new Date(stride?.startDate);
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : 0;
}

/**
 * Find the ID of the next stride after the given one, sorted by start date.
 * @param {number|string} currentStrideId - The ID of the current stride.
 * @returns {number|null} The next stride ID, or null if none found.
 */
function findNextStrideIdInIteration(currentStrideId) {
    const strides = Array.isArray(cachedAllStrides) ? [...cachedAllStrides] : [];
    strides.sort((a, b) => getStrideStartDateValue(a) - getStrideStartDateValue(b));
    const idx = strides.findIndex(s => String(s?.id) === String(currentStrideId));
    if (idx < 0) return null;
    const next = strides[idx + 1];
    return next?.id ?? null;
}

/**
 * Check if a moment row has a status of "Done".
 * @param {HTMLElement} row - The table row element for a moment.
 * @returns {boolean} Whether the status is "Done".
 */
function isRowDone(row) {
    const status = (row?.querySelector?.('.status-dropdown')?.value
        ?? row?.querySelector?.('.status-badge')?.textContent
        ?? '').trim();
    return status === 'Done';
}

/**
 * Remove the "no items" placeholder from a stride card, if present.
 * @param {HTMLElement} card - The stride card element.
 */
function removeNoItemsPlaceholder(card) {
    const noItems = card?.querySelector?.('.stride-moments .no-items');
    if (noItems) noItems.remove();
}

/**
 * Show the "no items" placeholder in a stride card if it has no moment rows.
 * @param {HTMLElement} card - The stride card element.
 */
function ensureNoItemsPlaceholder(card) {
    if (!card) return;
    const momentsContainer = card.querySelector('.stride-moments');
    if (!momentsContainer) return;

    const rowCount = card.querySelectorAll('table.promisemodel-table tbody tr[data-moment-id]').length;
    if (rowCount > 0) return;

    // If there is a table but no rows, show the empty state.
    momentsContainer.innerHTML = renderEmptyStateSection({
        icon: 'bi-clock',
        title: 'No moments assigned.',
        description: 'Move moments from the backlog into this stride.',
    });
}

/**
 * Calculate and update the total effort display for a stride card based on its DOM rows.
 * @param {HTMLElement} card - The stride card element.
 */
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

/**
 * Move unfinished moment rows from the current stride card to the next stride card in the DOM.
 * @param {number|string} strideId - The ID of the stride being progressed.
 * @returns {{moved: number, targetVisible: boolean}} The number of rows moved and whether the target card was visible.
 */
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

/**
 * Generate HTML for an estimate (effort) dropdown select element.
 * @param {number|string} momentSeq - The moment sequence number.
 * @param {string|null} currentEstimate - The current estimate value.
 * @returns {string} The HTML string for the dropdown.
 */
function estimateDropdownHtml(momentSeq, currentEstimate) {
    return `<select class="estimate-dropdown" data-moment-id="${momentSeq}" data-current-estimate="${currentEstimate ?? ''}" aria-label="Effort estimate"></select>`;
}

/**
 * Generate HTML for an owner dropdown select element.
 * @param {number|string} momentSeq - The moment sequence number.
 * @param {number|string|null} ownerId - The current owner's ID.
 * @returns {string} The HTML string for the dropdown.
 */
function ownerDropdownHtml(momentSeq, ownerId) {
    return `<select class="owner-dropdown" data-moment-id="${momentSeq}" data-owner-id="${ownerId ?? ''}" aria-label="Owner"></select>`;
}

/**
 * Generate HTML for a moment type (Story/Job) dropdown select element.
 * @param {number|string} momentId - The moment ID.
 * @param {string} currentType - The current type value.
 * @returns {string} The HTML string for the dropdown.
 */
function momentTypeDropdownHtml(momentId, currentType) {
    const storySel = currentType === 'Story' ? 'selected' : '';
    const jobSel = currentType === 'Job' ? 'selected' : '';
    return `<select class="moment-type-dropdown form-select form-select-sm" data-moment-id="${momentId}" data-current-type="${currentType}" aria-label="Moment type">
        <option value="Story" ${storySel}>Story</option>
        <option value="Job" ${jobSel}>Job</option>
    </select>`;
}

/**
 * Generate HTML for a status dropdown select element.
 * @param {number|string} momentSeq - The moment sequence number.
 * @param {string|null} status - The current status value.
 * @returns {string} The HTML string for the dropdown.
 */
function statusDropdownHtml(momentSeq, status) {
    return `<select class="status-dropdown" data-moment-id="${momentSeq}" data-current-status="${status ?? ''}" aria-label="Status"></select>`;
}

/**
 * Update the status badge text and CSS class on a moment row.
 * @param {HTMLElement} row - The table row element for the moment.
 * @param {string} newStatus - The new status value.
 */
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

/**
 * Get the content element (moments container or backlog content) within a board.
 * @param {HTMLElement} board - The board element (stride card or backlog).
 * @returns {HTMLElement|null} The content element, or null.
 */
function boardContentElement(board) {
    return board?.querySelector('.stride-moments, .backlog-content') ?? null;
}

/**
 * Generate HTML for the collapse/expand toggle button of a board.
 * @param {boolean} collapsed - Whether the board is currently collapsed.
 * @returns {string} The HTML string for the toggle button.
 */
function boardToggleButtonHtml(collapsed) {
    const iconClass = collapsed ? 'bi-chevron-down' : 'bi-chevron-up';
    const label = collapsed ? 'Expand board' : 'Collapse board';

    return `
        <button class="stride-toggle-btn" type="button" aria-label="${label}" title="${label}" aria-pressed="${String(!collapsed)}">
            <i class="bi ${iconClass}" aria-hidden="true"></i>
        </button>
    `;
}

/**
 * Generate HTML for a board header with toggle button, title, and optional actions.
 * @param {string} title - The board title.
 * @param {boolean} collapsed - Whether the board is collapsed.
 * @param {string} [extraActionsHtml=''] - Optional extra action buttons HTML.
 * @returns {string} The HTML string for the header.
 */
function boardHeaderHtml(title, collapsed, extraActionsHtml = '') {
    return `
        <div class="stride-header">
            <div class="stride-header-main">
                ${boardToggleButtonHtml(collapsed)}
                <h3>${escapeHtml(title)}</h3>
            </div>
            ${extraActionsHtml ? `<div class="stride-header-actions ms-auto">${extraActionsHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Set the collapsed state of a board and update its toggle button appearance.
 * @param {HTMLElement} board - The board element.
 * @param {boolean} collapsed - Whether to collapse the board.
 */
function setBoardCollapsed(board, collapsed) {
    if (!board) return;

    board.classList.toggle('is-collapsed', collapsed);

    const content = boardContentElement(board);
    if (content) {
        content.classList.toggle('hidden', collapsed);
    }

    const toggleButton = board.querySelector('.stride-toggle-btn');
    const icon = toggleButton?.querySelector('.bi');
    if (toggleButton && icon) {
        const iconClass = collapsed ? 'bi-chevron-down' : 'bi-chevron-up';
        const label = collapsed ? 'Expand board' : 'Collapse board';
        icon.className = `bi ${iconClass}`;
        toggleButton.setAttribute('aria-label', label);
        toggleButton.setAttribute('title', label);
        toggleButton.setAttribute('aria-pressed', String(!collapsed));
    }
}

/**
 * Bind click event listeners to collapse/expand toggle buttons within a root element.
 * @param {HTMLElement} root - The root element to bind toggles within.
 */
function bindBoardCollapseToggles(root) {
    if (!root || root.dataset.boundCollapseToggles === '1') return;

    root.dataset.boundCollapseToggles = '1';
    root.addEventListener('click', (event) => {
        const toggleButton = event.target.closest('.stride-toggle-btn');
        if (!toggleButton) return;

        const board = toggleButton.closest('[data-collapsible-board]');
        if (!board) return;

        setBoardCollapsed(board, !board.classList.contains('is-collapsed'));
    });
}

/**
 * Synchronize CSS custom properties for stride card sticky positioning based on header height.
 */
function syncStrideStickyOffsets() {
    const appHeader = document.querySelector('.header');
    const appHeaderHeight = appHeader?.offsetHeight ?? 0;

    document.querySelectorAll('[data-collapsible-board]').forEach(board => {
        board.style.setProperty('--stride-sticky-top', `${appHeaderHeight}px`);
        const header = board.querySelector('.stride-header');
        const headerHeight = header?.offsetHeight ?? 0;
        board.style.setProperty('--stride-header-height', `${headerHeight}px`);
    });
}

/**
 * Bind a resize event listener to sync stride sticky offsets (only once).
 */
function bindStrideStickyOffsetSync() {
    if (strideStickySyncBound) return;

    strideStickySyncBound = true;
    window.addEventListener('resize', syncStrideStickyOffsets);
}

/**
 * Render a scrollspy navigation for stride cards and the backlog section.
 * @param {Array} strides - The array of stride objects.
 */
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

/**
 * Generate HTML for a "Graph View" link button for a moment.
 * @param {number|string} seqNum - The moment sequence number.
 * @returns {string} The HTML string for the link, or empty string if unavailable.
 */
function momentGraphLinkHtml(seqNum) {
    const href = buildGraphViewHref(cachedOwner, cachedProject, `moment-${seqNum}`);
    if (!href) return '';

    return `
        <a href="${href}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${seqNum}">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Graph View</span>
        </a>
    `;
}

/**
 * Create a Bootstrap confirmation modal element and append it to the document body.
 * @param {string} id - The modal element ID.
 * @param {string} title - The modal title text.
 * @param {string} confirmText - The text for the confirm button.
 * @param {string} confirmClass - The CSS class for the confirm button (e.g. "btn-danger").
 * @returns {HTMLElement} The modal DOM element.
 */
function createConfirmModal(id, title, confirmText, confirmClass) {
    let modalEl = document.getElementById(id);
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = id;
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-0" id="${id}-text"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn ${confirmClass}" id="${id}-confirm">${confirmText}</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalEl);
    return modalEl;
}

/**
 * Ensure the "Move to Backlog" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureBacklogMoveModal() {
    return createConfirmModal('move-to-backlog-modal', 'Move to Backlog?', 'Move to Backlog', 'btn-danger');
}

/**
 * Show a confirmation dialog and move a moment to the backlog on confirmation.
 * @param {number|string} momentId - The moment ID to move.
 * @param {Function} onConfirm - The async callback to execute on confirmation.
 */
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

/**
 * Ensure the "Move to Stride" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureMoveToStrideModal() {
    return createConfirmModal('move-to-stride-modal', 'Move to Stride?', 'Move', 'btn-primary');
}

/**
 * Ensure the "Progress Stride" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureProgressStrideModal() {
    return createConfirmModal('progress-stride-modal', 'Progress Stride?', 'Progress', 'btn-success');
}

/**
 * Show a confirmation dialog for progressing a stride.
 * @param {number|string} strideId - The ID of the stride to progress.
 * @returns {Promise<boolean>} Whether the user confirmed the action.
 */
function promptProgressStride(strideId) {
    const modalEl = ensureProgressStrideModal();
    const modalText = modalEl.querySelector('#progress-stride-modal-text');
    const confirmButton = modalEl.querySelector('#progress-stride-modal-confirm');
    if (!modalText || !confirmButton) {
        return Promise.resolve(window.confirm('Move all unfinished moments to the next stride?'));
    }

    const strideCard = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
    const strideName = strideCard?.querySelector('.stride-header h3')?.textContent?.trim();
    modalText.textContent = strideName
        ? `Move all unfinished moments in ${strideName} to the next stride?`
        : 'Move all unfinished moments to the next stride?';

    return new Promise(resolve => {
        let settled = false;

        const settle = value => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const modalInstance = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);

        confirmButton.addEventListener('click', () => {
            settle(true);
            modalInstance?.hide();
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => settle(false), { once: true });
        modalInstance?.show();
    });
}

/**
 * Show a confirmation dialog for moving a moment to a specific stride.
 * @param {number|string} momentId - The moment ID to move.
 * @param {number|string} strideId - The target stride ID.
 * @param {Function} onConfirm - The async callback to execute on confirmation.
 */
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

/**
 * Get a truncated (35 chars) statement text for a moment by its ID.
 * @param {number|string} momentId - The moment ID.
 * @returns {string} The truncated statement, or a fallback string.
 */
function truncateMomentStatement(momentId) {
    const row = findMomentRow(momentId);
    const statementCell = row?.querySelector('td');
    const statement = String(statementCell?.textContent ?? '').trim();
    if (!statement) return `moment ${momentId}`;
    return statement.slice(0, 35);
}

/**
 * Find a moment table row element by its data-moment-id attribute.
 * @param {number|string} momentId - The moment ID.
 * @returns {HTMLElement|null} The table row element, or null.
 */
function findMomentRow(momentId) {
    return document.querySelector(`tr[data-moment-id="${momentId}"]`);
}

/**
 * Ensure the backlog section has a table tbody element, creating the board structure if needed.
 * @returns {HTMLElement|null} The backlog tbody element, or null.
 */
function ensureBacklogTbody() {
    const backlogSection = document.getElementById('backlog-section');
    if (!backlogSection) return null;

    const tbody = backlogSection.querySelector('.backlog-content table.promisemodel-table tbody');
    if (tbody) return tbody;

    backlogSection.innerHTML = `
        <div class="stride-card backlog-board is-collapsed" data-collapsible-board="1">
            ${boardHeaderHtml('Backlog', true)}
            <div class="stride-moments backlog-content hidden">
                <table class="promisemodel-table">
                    <thead>
                        <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
    return backlogSection.querySelector('.backlog-content table.promisemodel-table tbody');
}

/**
 * Create a table row element for a backlog moment.
 * @param {Object} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createBacklogRow(moment) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = moment.sequenceNumber;
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement)}</td>
        <td>${momentTypeDropdownHtml(moment.sequenceNumber, moment.type)}</td>
        <td><span class="status-badge status-${(moment.status || '').toLowerCase()}">${moment.status}</span></td>
        <td>${moment.effortEstimate ?? '–'}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${moment.sequenceNumber}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${moment.sequenceNumber}" type="button">Move</button>
                ${momentGraphLinkHtml(moment.sequenceNumber)}
                <a href="/${cachedOwner}/${cachedProject}/moments/${moment.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;

    const select = tr.querySelector('.backlog-target-stride');
    populateBacklogStrideSelect(select);
    return tr;
}

/**
 * Ensure a stride card has a table tbody element, creating the table structure if needed.
 * @param {number|string} strideId - The stride ID.
 * @returns {HTMLElement|null} The tbody element, or null.
 */
function ensureStrideTbody(strideId) {
    const card = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
    if (!card) return null;

    const tbody = card.querySelector('table.promisemodel-table tbody');
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

/**
 * Create a table row element for a moment within a stride.
 * @param {Object} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createStrideRow(moment) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = moment.sequenceNumber;
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement)}</td>
        <td>${momentTypeDropdownHtml(moment.sequenceNumber, moment.type)}</td>
        <td><span class="status-badge status-${(moment.status || '').toLowerCase()}">${moment.status}</span></td>
        <td>${estimateDropdownHtml(moment.sequenceNumber, moment.effortEstimate)}</td>
        <td>${ownerDropdownHtml(moment.sequenceNumber, moment.ownerId)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${statusDropdownHtml(moment.sequenceNumber, moment.status)}
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${moment.sequenceNumber}" data-current-estimate="${moment.effortEstimate ?? ''}"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${moment.sequenceNumber}" type="button">Backlog</button>
                ${momentGraphLinkHtml(moment.sequenceNumber)}
                <a href="/${cachedOwner}/${cachedProject}/moments/${moment.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;
    // Populate the selects using DOM methods to avoid innerHTML option rebuilding.
    const estimateSelect = tr.querySelector('.estimate-dropdown');
    const estimateMobile = tr.querySelector('.estimate-dropdown-mobile');
    const ownerSelect = tr.querySelector('.owner-dropdown');
    const statusSelect = tr.querySelector('.status-dropdown');

    if (estimateSelect) populateEstimateSelect(estimateSelect);
    if (estimateMobile) populateEstimateSelect(estimateMobile);
    if (statusSelect) populateStatusSelect(statusSelect);
    if (ownerSelect) {
        // data-owner-id already set in the placeholder markup; populate will pick it up.
        populateOwnerSelect(ownerSelect);
    }
    return tr;
}

/**
 * Bind change and click event listeners for inline moment controls (status, estimate, owner, type, move, progress).
 * @param {HTMLElement} root - The root element to bind events on.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function bindInlineMomentControls(root, owner, project, navContentDiv, contentDiv) {
    if (!root) return;

    // Prevent double binding ON ROOT (not elements)
    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    root.addEventListener('change', async (e) => {
        const target = e.target;

        // STATUS
        if (target.matches('.status-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const updated = await updateMomentStatus(owner, project, momentId, target.value);
                const row = findMomentRow(momentId);
                updateStatusBadge(row, updated.status);
            } catch (err) {
                target.value = previous;
                alert('Failed to update status');
            }
        }

        // ESTIMATE
        if (target.matches('.estimate-dropdown') || target.matches('.estimate-dropdown-mobile')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const estimate = target.value === '' ? null : target.value;
                await updateMomentEstimate(owner, project, momentId, estimate);
                // Recalculate totals for the containing stride card immediately
                const row = findMomentRow(momentId);
                const card = row ? row.closest('.stride-card') : null;
                if (card) updateStrideTotalEffortFromDom(card);
            } catch (err) {
                target.value = previous;
                alert('Failed to update estimate');
            }
        }

        // OWNER
        if (target.matches('.owner-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const previous = target.value;

            try {
                const newOwnerId = target.value ? parseInt(target.value, 10) : null;
                const updated = await updateMomentOwner(owner, project, momentId, newOwnerId);
                target.value = updated.ownerId ?? '';
            } catch (err) {
                target.value = previous;
                alert('Failed to update owner');
            }
        }

        // TYPE
        if (target.matches('.moment-type-dropdown')) {
            const momentId = parseInt(target.dataset.momentId, 10);
            const newType = target.value;
            const previous = target.dataset.currentType || newType;
            try {
                await updateMomentType(owner, project, momentId, newType);
                target.dataset.currentType = newType;
            } catch (err) {
                target.value = previous;
                alert('Failed to update type');
            }
        }
    });

    root.addEventListener('click', async (e) => {
        // Handle View navigation (NO REFRESH)
        const viewLink = e.target.closest('a[data-moment-view]');
        if (viewLink) {
            e.preventDefault();

            navigate(viewLink.getAttribute('href'), navContentDiv, contentDiv);

            return;
        }

        const btn = e.target.closest(
            '.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn'
        );

        if (!btn) return;

        // Move to Backlog
        if (btn.classList.contains('move-to-backlog-btn')) {
            const momentId = parseInt(btn.dataset.momentId, 10);
            promptMoveToBacklog(momentId, async () => {
                const updated = await assignMomentToStride(owner, project, momentId, null);
                preserveScroll(() => {
                    const row = findMomentRow(momentId);
                    const origCard = row ? row.closest('.stride-card') : null;
                    if (row) row.remove();

                    const tbody = ensureBacklogTbody();
                    if (tbody) {
                        tbody.appendChild(createBacklogRow(updated));
                    }

                    if (origCard) {
                        updateStrideTotalEffortFromDom(origCard);
                        ensureNoItemsPlaceholder(origCard);
                    }
                });
            });
        }

        // Move to Stride
        if (btn.classList.contains('move-to-stride-from-backlog-btn')) {
            const momentId = parseInt(btn.dataset.momentId, 10);
            const row = btn.closest('tr');
            const select = row?.querySelector('.backlog-target-stride');
            const strideId = select ? parseInt(select.value, 10) : null;

            if (!strideId) return;
            promptMoveToStride(momentId, strideId, async () => {
                const updated = await assignMomentToStride(owner, project, momentId, strideId);
                preserveScroll(() => {
                    // Remove backlog row
                    findMomentRow(momentId)?.remove();

                    const tbody = ensureStrideTbody(strideId);
                    const targetCard = document.querySelector(`.stride-card[data-stride-id="${strideId}"]`);
                    if (tbody) {
                        tbody.appendChild(createStrideRow(updated));
                    }

                    if (targetCard) {
                        updateStrideTotalEffortFromDom(targetCard);
                        removeNoItemsPlaceholder(targetCard);
                    }
                });
            });
        }

        // Progress Stride
        if (btn.classList.contains('progress-stride-btn')) {
            const strideId = parseInt(btn.dataset.strideId, 10);

            if (!(await promptProgressStride(strideId))) return;

            try {
                await progressStride(owner, project, strideId);

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

/**
 * Calculate the total effort estimate for an array of moments.
 * @param {Array} moments - The array of moment objects.
 * @returns {number} The sum of effort estimate values.
 */
function totalEffort(moments) {
    return moments.reduce((sum, m) => sum + (estimateValues[m.effortEstimate] || 0), 0);
}

/* ---------- Main export ---------- */
/**
 * Load and render the strides listing page for the latest iteration, including stride cards and backlog.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Object} permission - The user's permission object.
 */
export function loadStridesList(owner, project, navContentDiv, contentDiv, permission) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');
    const errorEl = document.getElementById('error-text');
    const projectTitle = document.getElementById('project-title');
    const createStrideBtn = document.getElementById('create-stride-btn');
    const createStrideBtnLabel = document.getElementById('create-stride-btn-label');

    cachedOwner = owner;
    cachedProject = project;
    strideBoard.innerHTML = renderLoadingSpinner('Loading strides');
    errorEl.textContent = '';
    if (backlogSection) backlogSection.innerHTML = '';

    bindBoardCollapseToggles(strideBoard);
    bindBoardCollapseToggles(backlogSection);
    bindStrideStickyOffsetSync();

    const canEdit = permission?.permission === 'Edit';

    if (createStrideBtn) {
        if (!canEdit) {
            createStrideBtn.classList.add('d-none');
        } else if (createStrideBtn.dataset.bound !== '1') {
            createStrideBtn.dataset.bound = '1';
            createStrideBtn.addEventListener('click', () => {
            if (!cachedIterations.length) {
                openIterationCreateModal(owner, project, () => loadStridesList(owner, project, navContentDiv, contentDiv));
                return;
            }

            const latestIteration = cachedIterations[0];
            openStrideCreateModal({
                owner,
                project,
                iterationId: latestIteration.id,
                iterations: cachedIterations,
                existingStrides: cachedAllStrides,
                onCreated: () => loadStridesList(owner, project, navContentDiv, contentDiv),
            });
        });
    }
    }

    Promise.all([
        getProject(owner, project).catch(() => null),
        getIterations(owner, project)
    ])
        .then(([projectData, iterations]) => {
            cachedIterations = Array.isArray(iterations) ? [...iterations].sort((a, b) => b.id - a.id) : [];

            if (!cachedIterations.length) {
                strideBoard.innerHTML = renderEmptyStateSection({
                    icon: 'bi-repeat',
                    title: 'No iterations found for this project.',
                    description: 'Create the first iteration to start planning your work.',
                });
                if (projectTitle) {
                    projectTitle.innerHTML = `<h2>${escapeHtml(projectData?.name ?? `Project ${owner}/${project}`)}</h2>`;
                }
                if (createStrideBtnLabel) {
                    createStrideBtnLabel.textContent = 'Create First Iteration';
                }
                return;
            }
            const latestIteration = cachedIterations[0];
            const projectName = projectData?.name ?? `Project ${owner}/${project}`;
            projectTitle.innerHTML = `<h2>${escapeHtml(projectName)} – ${escapeHtml(latestIteration.name)}</h2>`;
            if (createStrideBtnLabel) {
                createStrideBtnLabel.textContent = 'New Stride';
            }

            const historyLink = document.getElementById('iteration-history-link');
            if (historyLink) {
                historyLink.addEventListener('click', () => {
                    navigate(`/${owner}/${project}/iterations`, navContentDiv, contentDiv);
                });
            }
            
            return Promise.all([
                getStridesByIteration(owner, project, latestIteration.id),
                getMomentsByIteration(owner, project, latestIteration.id, true)
            ]).then(([strides, backlogMoments]) => ({ strides, backlogMoments }));
        })
        .then(data => {
            if (!data) return;
            const { strides, backlogMoments } = data;
            strideBoard.innerHTML = '';

            if (!strides || strides.length === 0) {
                strideBoard.innerHTML = renderEmptyStateSection({
                    icon: 'bi-kanban',
                    title: 'No strides found for this iteration.',
                    description: 'Create a stride to organize your moments into sprints.',
                });
            } else {
                renderStrideScrollspy(strides);
                const stridePromises = strides.map(stride =>
                    getMomentsByStride(owner, project, stride.id)
                        .then(moments => ({ stride, moments }))
                        .catch(err => { console.error('Failed to load moments for stride', stride.id, err); return { stride, moments: [] }; })
                );
                return Promise.all(stridePromises).then(results => ({ results, backlogMoments, strides }));
            }
            return { results: [], backlogMoments, strides: [] };
        })
        .then(data => {
            if (!data) return;
            const { results, backlogMoments, strides: allStrides } = data;

            // Render stride cards
            results.forEach(({ stride, moments }, index) => {
                const collapsed = index !== 0;
                const card = document.createElement('div');
                card.className = `stride-card${collapsed ? ' is-collapsed' : ''}`;
                card.dataset.strideId = stride.id;
                card.id = `stride-card-${stride.id}`;
                card.dataset.collapsibleBoard = '1';
                const effTotal = totalEffort(moments);
                card.innerHTML = `
                    <div class="stride-header">
                        <div class="stride-header-main">
                            ${boardToggleButtonHtml(collapsed)}
                            <h3>${escapeHtml(stride.name)}</h3>
                            <span class="stride-dates">${formatDate(stride.startDate)} – ${formatDate(stride.endDate)}</span>
                            <span class="stride-duration">(${stride.durationDays} days)</span>
                            <span class="stride-countdown" data-end-date="${stride.endDate}"></span>
                            <span class="stride-total-effort">Total Effort: ${effTotal}</span>
                        </div>
                        <div class="stride-header-actions ms-auto">
                            <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${stride.id}" type="button"><span aria-hidden="true">🧟</span> Progress</button>
                        </div>
                    </div>
                    <div class="stride-moments${collapsed ? ' hidden' : ''}">
                        ${moments.length === 0
                            ? renderEmptyStateSection({
                                icon: 'bi-clock',
                                title: 'No moments assigned.',
                                description: 'Move moments from the backlog into this stride.',
                            })
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
                                        <tr data-moment-id="${m.sequenceNumber}">
                                            <td>${escapeHtml(m.statement)}</td>
                                            <td>${momentTypeDropdownHtml(m.sequenceNumber, m.type)}</td>
                                            <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                            <td>
                                                <select class="estimate-dropdown" data-moment-id="${m.sequenceNumber}" data-current-estimate="${m.effortEstimate ?? ''}" aria-label="Effort estimate"></select>
                                            </td>
                                            <td>
                                                <select class="owner-dropdown" data-moment-id="${m.sequenceNumber}" data-owner-id="${m.ownerId ?? ''}" aria-label="Owner"></select>
                                            </td>
            <td>
                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                    <select class="status-dropdown form-select form-select-sm" data-moment-id="${m.sequenceNumber}" data-current-status="${m.status ?? ''}" aria-label="Status"></select>
                    <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${m.sequenceNumber}" data-current-estimate="${m.effortEstimate ?? ''}" aria-label="Effort estimate"><option value="">–</option></select>
                    <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${m.sequenceNumber}" type="button">Backlog</button>
                    ${momentGraphLinkHtml(m.sequenceNumber)}
                    <a href="/${owner}/${project}/moments/${m.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
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
                const backlogCollapsed = allStrides && allStrides.length > 0;
                if (!backlogMoments || backlogMoments.length === 0) {
                    backlogSection.innerHTML = `
                        <div class="stride-card backlog-board${backlogCollapsed ? ' is-collapsed' : ''}" data-collapsible-board="1">
                            ${boardHeaderHtml('Backlog', backlogCollapsed)}
                            <div class="stride-moments backlog-content${backlogCollapsed ? ' hidden' : ''}">
                                ${renderEmptyStateSection({
                                    icon: 'bi-inbox',
                                    title: 'No unassigned moments.',
                                    description: 'Create new moments or assign existing ones to this project.',
                                })}
                            </div>
                        </div>
                    `;
                } else {
                    backlogSection.innerHTML = `
                        <div class="stride-card backlog-board${backlogCollapsed ? ' is-collapsed' : ''}" data-collapsible-board="1">
                            ${boardHeaderHtml('Backlog', backlogCollapsed)}
                            <div class="stride-moments backlog-content${backlogCollapsed ? ' hidden' : ''}">
                                <table class="promisemodel-table">
                                    <thead><tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        ${backlogMoments.map(m => `
                                            <tr data-moment-id="${m.sequenceNumber}">
                                                <td>${escapeHtml(m.statement)}</td>
                                                <td>${momentTypeDropdownHtml(m.sequenceNumber, m.type)}</td>
                                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                                <td>${m.effortEstimate ?? '–'}</td>
                                                <td>
                                                    <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                        <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${m.sequenceNumber}"></select>
                                                        <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${m.sequenceNumber}" type="button">Move</button>
                                                        ${momentGraphLinkHtml(m.sequenceNumber)}
                                                        <a href="/${owner}/${project}/moments/${m.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>`;
                    // Populate backlog stride selects
                    populateSelectsWithin(backlogSection);
                }
            }

            requestAnimationFrame(syncStrideStickyOffsets);

            // Load project members and populate owner dropdowns
            getProjectMembers(owner, project)
                .then(members => {
                    cachedMembers = Array.isArray(members) ? members : [];
                    // Populate all owner dropdowns now that we have members
                    document.querySelectorAll('.owner-dropdown').forEach(dropdown => populateOwnerSelect(dropdown));
                })
                .catch(err => console.error('Failed to load project members', err));
                
            // Fetch permission and update UI
            getMyPermission(owner, project)
                .then(level => {
                    cachedCanEdit = (level && (level.toLowerCase() === 'edit' || level.toLowerCase() === 'owner'));

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
            attachPlanningListeners(owner, project, navContentDiv, contentDiv);
        })
        .catch(err => {
            strideBoard.innerHTML = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

/* ---------- Event listeners ---------- */
/**
 * Attach inline moment control event listeners to the stride board and backlog section.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function attachPlanningListeners(owner, project, navContentDiv, contentDiv) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');

    bindInlineMomentControls(strideBoard, owner, project, navContentDiv, contentDiv);
    bindInlineMomentControls(backlogSection, owner, project, navContentDiv, contentDiv);
}

/**
 * Create a DOM option element.
 * @param {string|null} value - The option value.
 * @param {string|null} text - The option display text.
 * @param {boolean} selected - Whether the option is selected.
 * @returns {HTMLOptionElement} The option element.
 */
function createOption(value, text, selected) {
    const opt = document.createElement('option');
    opt.value = String(value ?? '');
    opt.textContent = text ?? '';
    if (selected) opt.selected = true;
    return opt;
}

const estimateOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/**
 * Populate an estimate dropdown with t-shirt size options based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateEstimateSelect(select) {
    if (!select) return;
    const current = select.getAttribute('data-current-estimate') || select.value || '';
    select.innerHTML = '';
    select.appendChild(createOption('', '–', current === ''));
    estimateOrder.forEach(k => select.appendChild(createOption(k, k, String(current) === String(k))));
}

/**
 * Populate a status dropdown with status options based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateStatusSelect(select) {
    if (!select) return;
    const current = select.getAttribute('data-current-status') || select.value || '';
    select.innerHTML = '';
    for (const opt of STATUS_OPTIONS) {
        select.appendChild(createOption(opt.value, `${opt.icon} ${opt.label}`, current === opt.value));
    }
}

/**
 * Populate an owner dropdown with project members based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
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

/**
 * Populate a backlog target stride dropdown with cached stride options.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateBacklogStrideSelect(select) {
    if (!select) return;
    const prev = select.value || '';
    select.innerHTML = '';
    (cachedAllStrides || []).forEach(s => select.appendChild(createOption(String(s.id), s.name, String(prev) === String(s.id))));
    if (![...select.options].some(o => o.value === String(prev))) select.value = (select.options[0] && select.options[0].value) || '';
}

/**
 * Populate all estimate, status, owner, and backlog stride selects within a root element.
 * @param {HTMLElement} root - The root element containing the selects.
 */
function populateSelectsWithin(root) {
    if (!root) return;
    root.querySelectorAll('.estimate-dropdown').forEach(populateEstimateSelect);
    root.querySelectorAll('.estimate-dropdown-mobile').forEach(populateEstimateSelect);
    root.querySelectorAll('.status-dropdown').forEach(populateStatusSelect);
    root.querySelectorAll('.owner-dropdown').forEach(populateOwnerSelect);
    root.querySelectorAll('.backlog-target-stride').forEach(populateBacklogStrideSelect);
}

/**
 * Format a date string as a human-readable short date (e.g. "Jan 1, 2023").
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date, or "N/A" if invalid.
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Update all stride countdown elements with the remaining days until the end date.
 */
function updateCountdowns() {
    document.querySelectorAll('.stride-countdown').forEach(el => {
        const endDate = new Date(el.dataset.endDate);
        const now = new Date();
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        el.classList.remove('stride-countdown--ended', 'stride-countdown--ending', 'stride-countdown--healthy');
        if (diffDays < 0) {
            el.textContent = 'Ended';
            el.classList.add('stride-countdown--ended');
        } else if (diffDays === 0) {
            el.textContent = 'Ends today';
            el.classList.add('stride-countdown--ending');
        } else if (diffDays <= 3) {
            el.textContent = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
            el.classList.add('stride-countdown--ending');
        } else {
            el.textContent = `${diffDays} days left`;
            el.classList.add('stride-countdown--healthy');
        }
    });
}