// @ts-nocheck
import { assignMomentToStride, updateMomentStatus, updateMomentEstimate, updateMomentOwner, updateMomentType } from '../moments/api.ts';
import { getProject } from '../projects/api.ts';
import { buildGraphViewHref } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.ts';
import { openIterationCreateModal } from '../utils/iteration-create-modal.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';
import { openStrideCreateModal } from '../utils/stride-create-modal.ts';

import { getIterations, getStridesByIteration, getMomentsByStride, getMomentsByIteration, getProjectMembers, getMyPermission, progressStride } from './api.ts';

/* ---------- T‑shirt size to numeric mapping ---------- */
const estimateValues: Record<string, number> = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

const _state: {
    cachedMembers: Record<string, unknown>[];
    cachedAllStrides: Record<string, unknown>[];
    cachedIterations: Record<string, unknown>[];
    isCachedCanEdit: boolean;
    cachedOwner: string | null;
    cachedProject: string | null;
    isStrideStickySyncBound: boolean;
} = {
    cachedMembers: [],
    cachedAllStrides: [],
    cachedIterations: [],
    isCachedCanEdit: false,
    isStrideStickySyncBound: false,
};

/**
 * Enable or disable UI controls based on the user's edit permission.
 * @param {boolean} canEdit - Whether the user has edit permission.
 */
function applyPermissionUI(canEdit: boolean): void {
    const controls = document.querySelectorAll(
        '.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn'
    );

    for (const element of controls) (element as HTMLInputElement).disabled = !canEdit;

    for (const button of document.querySelectorAll('.progress-stride-btn')) {
        button.classList.toggle('hidden', !canEdit);
    }
}

/**
 * Execute an action while preserving the current scroll position.
 * @param {() => unknown} action - The action to execute.
 * @returns {unknown} The return value of the action.
 */
function preserveScroll(action: () => unknown): unknown {
    const y = window.scrollY;
    const result = action();
    window.scrollTo(0, y);
    return result;
}

/**
 * Get the numeric timestamp of a stride's start date.
 * @param {Record<string, unknown>} stride - The stride object.
 * @returns {number} The start date timestamp, or 0 if invalid.
 */
function getStrideStartDateValue(stride: Record<string, unknown>): number {
    const d = new Date(stride?.startDate as string);
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : 0;
}

/**
 * Find the ID of the next stride after the given one, sorted by start date.
 * @param {number|string} currentStrideId - The ID of the current stride.
 * @returns {number|undefined} The next stride ID, or undefined if none found.
 */
function findNextStrideIdInIteration(currentStrideId: number | string): number | null {
    const strides = Array.isArray(_state.cachedAllStrides) ? [..._state.cachedAllStrides] : [];
    strides.sort((a, b) => getStrideStartDateValue(a) - getStrideStartDateValue(b));
    const index = strides.findIndex(s => String(s?.id) === String(currentStrideId));
    if (index === -1) return;
    const next = strides[index + 1];
    return next?.id as number;
}

/**
 * Check if a moment row has a status of "Done".
 * @param {HTMLElement} row - The table row element for a moment.
 * @returns {boolean} Whether the status is "Done".
 */
function isRowDone(row: HTMLElement): boolean {
    const status = ((row?.querySelector?.('.status-dropdown') as HTMLSelectElement)?.value
        ?? (row?.querySelector?.('.status-badge') as HTMLElement)?.textContent
        ?? '').trim();
    return status === 'Done';
}

/**
 * Remove the "no items" placeholder from a stride card, if present.
 * @param {HTMLElement} card - The stride card element.
 */
function removeNoItemsPlaceholder(card: HTMLElement): void {
    const noItems = card?.querySelector?.(':scope .stride-moments .no-items');
    if (noItems) noItems.remove();
}

/**
 * Show the "no items" placeholder in a stride card if it has no moment rows.
 * @param {HTMLElement} card - The stride card element.
 */
function ensureNoItemsPlaceholder(card: HTMLElement): void {
    if (!card) return;
    const momentsContainer = card.querySelector(':scope .stride-moments');
    if (!momentsContainer) return;

    const rowCount = card.querySelectorAll(':scope table.promisemodel-table tbody tr[data-moment-id]').length;
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
function updateStrideTotalEffortFromDom(card: HTMLElement): void {
    const totalElement = card?.querySelector?.('.stride-total-effort');
    if (!totalElement) return;

    let total = 0;
    for (const row of card.querySelectorAll(':scope table.promisemodel-table tbody tr[data-moment-id]')) {
        const estimate = (row.querySelector('.estimate-dropdown') as HTMLSelectElement)?.value;
        total += estimateValues[estimate] ?? 0;
    }

    totalElement.textContent = `Total Effort: ${total}`;
}

/**
 * Move unfinished moment rows from the current stride card to the next stride card in the DOM.
 * @param {number|string} strideId - The ID of the stride being progressed.
 * @returns {{moved: number, targetVisible: boolean}} The number of rows moved and whether the target card was visible.
 */
function progressStrideDomUpdate(strideId: number | string): { moved: number; targetVisible: boolean } {
    const currentCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(strideId)}"]`) as HTMLElement | null;
    if (!currentCard) return { moved: 0, targetVisible: false };

    const nextStrideId = findNextStrideIdInIteration(strideId);
    let targetCard;
    if (nextStrideId) {
        targetCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(nextStrideId)}"]`) as HTMLElement;
    }

    const unfinishedRows = [...currentCard.querySelectorAll('tr[data-moment-id]')]
        .filter(row => !isRowDone(row as HTMLElement)) as HTMLElement[];

    if (unfinishedRows.length === 0) {
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: 0, targetVisible: Boolean(targetCard) };
    }

    // If the next stride card isn't visible on this page (e.g., next iteration),
    // we can still remove rows from the current stride to reflect the backend move.
    if (!targetCard) {
        for (const r of unfinishedRows) r.remove();
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: unfinishedRows.length, targetVisible: false };
    }

    removeNoItemsPlaceholder(targetCard);
    const targetTbody = ensureStrideTbody(nextStrideId);
    if (!targetTbody) {
        for (const r of unfinishedRows) r.remove();
        updateStrideTotalEffortFromDom(currentCard);
        ensureNoItemsPlaceholder(currentCard);
        return { moved: unfinishedRows.length, targetVisible: false };
    }

    for (const row of unfinishedRows) targetTbody.append(row);
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
function estimateDropdownHtml(momentSeq: number | string, currentEstimate: string | null): string {
    return `<select class="estimate-dropdown" data-moment-id="${momentSeq}" data-current-estimate="${currentEstimate ?? ''}" aria-label="Effort estimate"></select>`;
}

/**
 * Generate HTML for an owner dropdown select element.
 * @param {number|string} momentSeq - The moment sequence number.
 * @param {number|string|null} ownerId - The current owner's ID.
 * @returns {string} The HTML string for the dropdown.
 */
function ownerDropdownHtml(momentSeq: number | string, ownerId: number | string | null): string {
    return `<select class="owner-dropdown" data-moment-id="${momentSeq}" data-owner-id="${ownerId ?? ''}" aria-label="Owner"></select>`;
}

/**
 * Generate HTML for a moment type (Story/Job) dropdown select element.
 * @param {number|string} momentId - The moment ID.
 * @param {string} currentType - The current type value.
 * @returns {string} The HTML string for the dropdown.
 */
function momentTypeDropdownHtml(momentId: number | string, currentType: string): string {
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
function statusDropdownHtml(momentSeq: number | string, status: string | null): string {
    return `<select class="status-dropdown" data-moment-id="${momentSeq}" data-current-status="${status ?? ''}" aria-label="Status"></select>`;
}

/**
 * Update the status badge text and CSS class on a moment row.
 * @param {HTMLElement} row - The table row element for the moment.
 * @param {string} newStatus - The new status value.
 */
function updateStatusBadge(row: HTMLElement, newStatus: string): void {
    const badge = row?.querySelector('.status-badge');
    if (!badge) return;

    const safeStatus = newStatus ?? '';
    badge.textContent = safeStatus;

    // Replace any existing status-* class.
    const classes = [...badge.classList];
    const statusClasses = classes.filter(c => c.startsWith('status-') && c !== 'status-badge');
    for (const c of statusClasses) {
        badge.classList.remove(c);
    }
    badge.classList.add(`status-${String(safeStatus).toLowerCase()}`);
}

/**
 * Get the content element (moments container or backlog content) within a board.
 * @param {HTMLElement} board - The board element (stride card or backlog).
 * @returns {HTMLElement|null} The content element, or null.
 */
function boardContentElement(board: HTMLElement): HTMLElement | null {
    return board?.querySelector('.stride-moments, .backlog-content');
}

/**
 * Generate HTML for the collapse/expand toggle button of a board.
 * @param {boolean} isCollapsed - Whether the board is currently collapsed.
 * @returns {string} The HTML string for the toggle button.
 */
function boardToggleButtonHtml(isCollapsed: boolean): string {
    const iconClass = isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up';
    const label = isCollapsed ? 'Expand board' : 'Collapse board';

    return `
        <button class="stride-toggle-btn" type="button" aria-label="${label}" title="${label}" aria-pressed="${String(!isCollapsed)}">
            <i class="bi ${iconClass}" aria-hidden="true"></i>
        </button>
    `;
}

/**
 * Generate HTML for a board header with toggle button, title, and optional actions.
 * @param {string} title - The board title.
 * @param {boolean} isCollapsed - Whether the board is collapsed.
 * @param {string} [extraActionsHtml] - Optional extra action buttons HTML.
 * @returns {string} The HTML string for the header.
 */
function boardHeaderHtml(title: string, isCollapsed: boolean, extraActionsHtml: string = ''): string {
    return `
        <div class="stride-header">
            <div class="stride-header-main">
                ${boardToggleButtonHtml(isCollapsed)}
                <h3>${escapeHtml(title)}</h3>
            </div>
            ${extraActionsHtml ? `<div class="stride-header-actions ms-auto">${extraActionsHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Set the collapsed state of a board and update its toggle button appearance.
 * @param {HTMLElement} board - The board element.
 * @param {boolean} isCollapsed - Whether to collapse the board.
 */
function setBoardCollapsed(board: HTMLElement, isCollapsed: boolean): void {
    if (!board) return;

    board.classList.toggle('is-collapsed', isCollapsed);

    const content = boardContentElement(board);
    if (content) {
        content.classList.toggle('hidden', isCollapsed);
    }

    const toggleButton = board.querySelector('.stride-toggle-btn');
    const icon = toggleButton?.querySelector('.bi');
    if (toggleButton && icon) {
        const iconClass = isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up';
        const label = isCollapsed ? 'Expand board' : 'Collapse board';
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
function bindBoardCollapseToggles(root: HTMLElement): void {
    if (!root || root.dataset.boundCollapseToggles === '1') return;

    root.dataset.boundCollapseToggles = '1';
    root.addEventListener('click', (event) => {
        const toggleButton = (event.target as HTMLElement).closest('.stride-toggle-btn');
        if (!toggleButton) return;

        const board = toggleButton.closest('[data-collapsible-board]') as HTMLElement | null;
        if (!board) return;

        setBoardCollapsed(board, !board.classList.contains('is-collapsed'));
    });
}

/**
 * Synchronize CSS custom properties for stride card sticky positioning based on header height.
 */
function syncStrideStickyOffsets(): void {
    const appHeader = document.querySelector('.header') as HTMLElement | null;
    const appHeaderHeight = appHeader?.offsetHeight ?? 0;

    for (const board of document.querySelectorAll('[data-collapsible-board]')) {
        (board as HTMLElement).style.setProperty('--stride-sticky-top', `${appHeaderHeight}px`);
        const header = (board as HTMLElement).querySelector(':scope .stride-header');
        const headerHeight = (header as HTMLElement)?.offsetHeight ?? 0;
        (board as HTMLElement).style.setProperty('--stride-header-height', `${headerHeight}px`);
    }
}

/**
 * Bind a resize event listener to sync stride sticky offsets (only once).
 */
function bindStrideStickyOffsetSync(): void {
    if (_state.isStrideStickySyncBound) return;

    _state.isStrideStickySyncBound = true;
    window.addEventListener('resize', syncStrideStickyOffsets);
}

/**
 * Render a scrollspy navigation for stride cards and the backlog section.
 * @param {Record<string, unknown>[]} strides - The array of stride objects.
 */
function renderStrideScrollspy(strides: Record<string, unknown>[]): void {
    const nav = document.querySelector('#stride-scrollspy-nav');
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
    for (const stride of strides) {
        const link = document.createElement('a');
        link.className = 'nav-link py-1 px-2';
        link.href = `#stride-card-${stride.id}`;
        link.textContent = stride.name as string;
        links?.append(link);
    }

    const backlogLink = document.createElement('a');
    backlogLink.className = 'nav-link py-1 px-2';
    backlogLink.href = '#backlog-section';
    backlogLink.textContent = 'Backlog';
    links?.append(backlogLink);

    const spyApi = (globalThis as unknown as Record<string, unknown>).bootstrap?.ScrollSpy as { getOrCreateInstance?: unknown };
    if (spyApi) {
        const spy = (spyApi as { getOrCreateInstance: (element: Element, options?: Record<string, unknown>) => { refresh?: () => void } }).getOrCreateInstance(document.body, {
            target: '#stride-scrollspy-links',
            offset: 140,
        });
        spy?.refresh?.();
    }

    if (nav.dataset.boundScrollspyClick !== '1') {
        nav.dataset.boundScrollspyClick = '1';
        nav.addEventListener('click', (event) => {
            const link = (event.target as HTMLElement).closest('a.nav-link');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState({}, '', href);
        });
    }
}

/**
 * Generate HTML for a "Graph View" link button for a moment.
 * @param {number|string} seqNumber - The moment sequence number.
 * @returns {string} The HTML string for the link, or empty string if unavailable.
 */
function momentGraphLinkHtml(seqNumber: number | string): string {
    const href = buildGraphViewHref(_state.cachedOwner, _state.cachedProject, `moment-${seqNumber}`);
    if (!href) return '';

    return `
        <a href="${href}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${seqNumber}">
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
function createConfirmModal(id: string, title: string, confirmText: string, confirmClass: string): HTMLElement {
    let modalElement = document.querySelector(`#${CSS.escape(id)}`);
    if (modalElement) return modalElement;

    modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = id;
    modalElement.tabIndex = -1;
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.innerHTML = `
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

    document.body.append(modalElement);
    return modalElement;
}

/**
 * Ensure the "Move to Backlog" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureBacklogMoveModal(): HTMLElement {
    return createConfirmModal('move-to-backlog-modal', 'Move to Backlog?', 'Move to Backlog', 'btn-danger');
}

/**
 * Show a confirmation dialog and move a moment to the backlog on confirmation.
 * @param {number|string} momentId - The moment ID to move.
 * @param {() => Promise<unknown>} onConfirm - The async callback to execute on confirmation.
 */
function promptMoveToBacklog(momentId: number | string, onConfirm: () => Promise<unknown>): void {
    const modalElement = ensureBacklogMoveModal();
    const modalText = modalElement.querySelector('#move-to-backlog-modal-text');
    const confirmButton = modalElement.querySelector('#move-to-backlog-modal-confirm');
    if (!modalText || !confirmButton) return;

    modalText.textContent = `Move ${truncateMomentStatement(momentId)} to the Backlog?`;

    const nextButton = confirmButton.cloneNode(true) as HTMLElement;
    confirmButton.parentElement!.replaceChild(nextButton, confirmButton);
    nextButton.addEventListener('click', async () => {
        (nextButton as HTMLInputElement).disabled = true;
        try {
            await onConfirm();
            ((globalThis as unknown as Record<string, unknown>).bootstrap as Record<string, unknown>)?.Modal?.getOrCreateInstance?.(modalElement)?.hide();
        } catch (error) {
            console.error(error);
            alert('Failed to move moment');
        } finally {
            (nextButton as HTMLInputElement).disabled = false;
        }
    }, { once: true });

    ((globalThis as unknown as Record<string, unknown>).bootstrap as Record<string, unknown>)?.Modal?.getOrCreateInstance?.(modalElement)?.show();
}

/**
 * Ensure the "Move to Stride" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureMoveToStrideModal(): HTMLElement {
    return createConfirmModal('move-to-stride-modal', 'Move to Stride?', 'Move', 'btn-primary');
}

/**
 * Ensure the "Progress Stride" confirmation modal exists, creating it if needed.
 * @returns {HTMLElement} The modal element.
 */
function ensureProgressStrideModal(): HTMLElement {
    return createConfirmModal('progress-stride-modal', 'Progress Stride?', 'Progress', 'btn-success');
}

/**
 * Show a confirmation dialog for progressing a stride.
 * @param {number|string} strideId - The ID of the stride to progress.
 * @returns {Promise<boolean>} Whether the user confirmed the action.
 */
function promptProgressStride(strideId: number | string): Promise<boolean> {
    const modalElement = ensureProgressStrideModal();
    const modalText = modalElement.querySelector('#progress-stride-modal-text');
    const confirmButton = modalElement.querySelector('#progress-stride-modal-confirm');
    if (!modalText || !confirmButton) {
        return Promise.resolve(confirm('Move all unfinished moments to the next stride?'));
    }

    const strideCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(strideId)}"]`);
    const strideName = strideCard?.querySelector(':scope .stride-header h3')?.textContent?.trim();
    modalText.textContent = strideName
        ? `Move all unfinished moments in ${strideName} to the next stride?`
        : 'Move all unfinished moments to the next stride?';

    return new Promise(resolve => {
        let isSettled = false;

        const settle = (isConfirmed: boolean) => {
            if (isSettled) return;
            isSettled = true;
            resolve(isConfirmed);
        };

        const modalInstance = ((globalThis as unknown as Record<string, unknown>).bootstrap as Record<string, unknown>)?.Modal?.getOrCreateInstance?.(modalElement) as { hide?: () => void } | undefined;

        confirmButton.addEventListener('click', () => {
            settle(true);
            modalInstance?.hide?.();
        }, { once: true });

        modalElement.addEventListener('hidden.bs.modal', () => settle(false), { once: true });
        modalInstance?.show?.();
    });
}

/**
 * Show a confirmation dialog for moving a moment to a specific stride.
 * @param {number|string} momentId - The moment ID to move.
 * @param {number|string} strideId - The target stride ID.
 * @param {() => Promise<unknown>} onConfirm - The async callback to execute on confirmation.
 */
function promptMoveToStride(momentId: number | string, strideId: number | string, onConfirm: () => Promise<unknown>): void {
    const modalElement = ensureMoveToStrideModal();
    const modalText = modalElement.querySelector('#move-to-stride-modal-text');
    const confirmButton = modalElement.querySelector('#move-to-stride-modal-confirm');
    if (!modalText || !confirmButton) return;

    modalText.textContent = `Move ${truncateMomentStatement(momentId)} to the selected stride?`;

    const nextButton = confirmButton.cloneNode(true) as HTMLElement;
    confirmButton.parentElement!.replaceChild(nextButton, confirmButton);
    nextButton.addEventListener('click', async () => {
        (nextButton as HTMLInputElement).disabled = true;
        try {
            await onConfirm();
            ((globalThis as unknown as Record<string, unknown>).bootstrap as Record<string, unknown>)?.Modal?.getOrCreateInstance?.(modalElement)?.hide();
        } catch (error) {
            console.error(error);
            alert('Failed to move moment');
        } finally {
            (nextButton as HTMLInputElement).disabled = false;
        }
    }, { once: true });

    ((globalThis as unknown as Record<string, unknown>).bootstrap as Record<string, unknown>)?.Modal?.getOrCreateInstance?.(modalElement)?.show();
}

/**
 * Get a truncated (35 chars) statement text for a moment by its ID.
 * @param {number|string} momentId - The moment ID.
 * @returns {string} The truncated statement, or a fallback string.
 */
function truncateMomentStatement(momentId: number | string): string {
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
function findMomentRow(momentId: number | string): HTMLElement | null {
    return document.querySelector(`tr[data-moment-id="${CSS.escape(momentId)}"]`);
}

/**
 * Ensure the backlog section has a table tbody element, creating the board structure if needed.
 * @returns {HTMLElement|undefined} The backlog tbody element, or undefined.
 */
function ensureBacklogTbody(): HTMLElement | null {
    const backlogSection = document.querySelector('#backlog-section');
    if (!backlogSection) return;

    const tbody = backlogSection.querySelector(':scope .backlog-content table.promisemodel-table tbody');
    if (tbody) return tbody as HTMLElement;

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
    return backlogSection.querySelector(':scope .backlog-content table.promisemodel-table tbody') as HTMLElement | null;
}

/**
 * Create a table row element for a backlog moment.
 * @param {Record<string, unknown>} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createBacklogRow(moment: Record<string, unknown>): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(moment.sequenceNumber);
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement as string)}</td>
        <td>${momentTypeDropdownHtml(moment.sequenceNumber as number | string, moment.type as string)}</td>
        <td><span class="status-badge status-${((moment.status as string) || '').toLowerCase()}">${moment.status as string}</span></td>
        <td>${moment.effortEstimate ?? '–'}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${moment.sequenceNumber as string}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${moment.sequenceNumber as string}" type="button">Move</button>
                ${momentGraphLinkHtml(moment.sequenceNumber as number | string)}
    <a href="/${_state.cachedOwner}/${_state.cachedProject}/moments/${moment.sequenceNumber as string}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                </div>
            </td>
        `;

    const select = tr.querySelector('.backlog-target-stride') as HTMLSelectElement | null;
    if (select) populateBacklogStrideSelect(select);
    return tr;
}

/**
 * Ensure a stride card has a table tbody element, creating the table structure if needed.
 * @param {number|string} strideId - The stride ID.
 * @returns {HTMLElement|undefined} The tbody element, or undefined.
 */
function ensureStrideTbody(strideId: number | string): HTMLElement | null {
    const card = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(strideId)}"]`) as HTMLElement;
    if (!card) return;

    const tbody = card.querySelector(':scope table.promisemodel-table tbody');
    if (tbody) return tbody as HTMLElement;

    const container = card.querySelector(':scope .stride-moments');
    if (!container) return;

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
    return card.querySelector(':scope table.promisemodel-table tbody') as HTMLElement | null;
}

/**
 * Create a table row element for a moment within a stride.
 * @param {Record<string, unknown>} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createStrideRow(moment: Record<string, unknown>): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(moment.sequenceNumber);
    tr.innerHTML = `
        <td>${escapeHtml(moment.statement as string)}</td>
        <td>${momentTypeDropdownHtml(moment.sequenceNumber as number | string, moment.type as string)}</td>
        <td><span class="status-badge status-${((moment.status as string) || '').toLowerCase()}">${moment.status as string}</span></td>
        <td>${estimateDropdownHtml(moment.sequenceNumber as number | string, moment.effortEstimate as string | null)}</td>
        <td>${ownerDropdownHtml(moment.sequenceNumber as number | string, moment.ownerId as number | string | null)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${statusDropdownHtml(moment.sequenceNumber as number | string, moment.status as string | null)}
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${moment.sequenceNumber as string}" data-current-estimate="${(moment.effortEstimate as string | null) ?? ''}"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${moment.sequenceNumber as string}" type="button">Backlog</button>
                ${momentGraphLinkHtml(moment.sequenceNumber as number | string)}
                <a href="/${_state.cachedOwner}/${_state.cachedProject}/moments/${moment.sequenceNumber as string}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;
    // Populate the selects using DOM methods to avoid innerHTML option rebuilding.
    const estimateSelect = tr.querySelector('.estimate-dropdown') as HTMLSelectElement | null;
    const estimateMobile = tr.querySelector('.estimate-dropdown-mobile') as HTMLSelectElement | null;
    const ownerSelect = tr.querySelector('.owner-dropdown') as HTMLSelectElement | null;
    const statusSelect = tr.querySelector('.status-dropdown') as HTMLSelectElement | null;

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
function bindInlineMomentControls(root: HTMLElement | null, owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    if (!root) return;

    // Prevent double binding ON ROOT (not elements)
    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    root.addEventListener('change', async (event) => {
        const target = event.target as HTMLElement;

        // STATUS
        if (target.matches('.status-dropdown')) {
            const momentId = parseInt((target as HTMLSelectElement).dataset.momentId!, 10);
            const previous = (target as HTMLSelectElement).value;

            try {
                const updated = await updateMomentStatus(owner, project, momentId, (target as HTMLSelectElement).value) as Record<string, unknown>;
                const row = findMomentRow(momentId);
                if (row) updateStatusBadge(row, updated.status as string);
            } catch {
                (target as HTMLSelectElement).value = previous;
                alert('Failed to update status');
            }
        }

        // ESTIMATE
        if (target.matches('.estimate-dropdown') || target.matches('.estimate-dropdown-mobile')) {
            const momentId = parseInt((target as HTMLSelectElement).dataset.momentId!, 10);
            const previous = (target as HTMLSelectElement).value;

            try {
                const estimate = (target as HTMLSelectElement).value === '' ? undefined : (target as HTMLSelectElement).value;
                await updateMomentEstimate(owner, project, momentId, estimate);
                // Recalculate totals for the containing stride card immediately
                const row = findMomentRow(momentId);
                const card = row?.closest('.stride-card') as HTMLElement | null;
                if (card) updateStrideTotalEffortFromDom(card);
            } catch {
                (target as HTMLSelectElement).value = previous;
                alert('Failed to update estimate');
            }
        }

        // OWNER
        if (target.matches('.owner-dropdown')) {
            const momentId = parseInt((target as HTMLSelectElement).dataset.momentId!, 10);
            const previous = (target as HTMLSelectElement).value;

            try {
                let newOwnerId;
                if ((target as HTMLSelectElement).value) {
                    newOwnerId = parseInt((target as HTMLSelectElement).value, 10);
                }
                const updated = await updateMomentOwner(owner, project, momentId, newOwnerId) as Record<string, unknown>;
                (target as HTMLSelectElement).value = String(updated.ownerId ?? '');
            } catch {
                (target as HTMLSelectElement).value = previous;
                alert('Failed to update owner');
            }
        }

        // TYPE
        if (target.matches('.moment-type-dropdown')) {
            const momentId = parseInt((target as HTMLSelectElement).dataset.momentId!, 10);
            const newType = (target as HTMLSelectElement).value;
            const previous = (target as HTMLSelectElement).dataset.currentType || newType;
            try {
                await updateMomentType(owner, project, momentId, newType);
                (target as HTMLSelectElement).dataset.currentType = newType;
            } catch {
                (target as HTMLSelectElement).value = previous;
                alert('Failed to update type');
            }
        }
    });

    root.addEventListener('click', async (event) => {
        // Handle View navigation (NO REFRESH)
        const viewLink = (event.target as HTMLElement).closest('a[data-moment-view]');
        if (viewLink) {
            e.preventDefault();

            navigate(viewLink.getAttribute('href'), navContentDiv, contentDiv);

            return;
        }

        const button = (e.target as HTMLElement).closest(
            '.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn'
        ) as HTMLElement | null;

        if (!button) return;

        // Move to Backlog
        if (button.classList.contains('move-to-backlog-btn')) {
            const momentId = parseInt(button.dataset.momentId!, 10);
            promptMoveToBacklog(momentId, async () => {
                const updated = await assignMomentToStride(owner, project, momentId, undefined) as Record<string, unknown>;
                preserveScroll(() => {
                    const row = findMomentRow(momentId);
                    const origCard = row?.closest('.stride-card') as HTMLElement | null;
                    if (row) row.remove();

                    const tbody = ensureBacklogTbody();
                    if (tbody) {
                        tbody.append(createBacklogRow(updated));
                    }

                    if (origCard) {
                        updateStrideTotalEffortFromDom(origCard);
                        ensureNoItemsPlaceholder(origCard);
                    }
                });
            });
        }

        // Move to Stride
        if (button.classList.contains('move-to-stride-from-backlog-btn')) {
            const momentId = parseInt(button.dataset.momentId!, 10);
            const row = button.closest('tr') as HTMLElement | null;
            const select = row?.querySelector('.backlog-target-stride') as HTMLSelectElement | null;
            let strideId;
            if (select) strideId = parseInt(select.value, 10);

            if (!strideId) return;
            promptMoveToStride(momentId, strideId, async () => {
                const updated = await assignMomentToStride(owner, project, momentId, strideId) as Record<string, unknown>;
                preserveScroll(() => {
                    // Remove backlog row
                    findMomentRow(momentId)?.remove();

                    const tbody = ensureStrideTbody(strideId);
                    const targetCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(strideId)}"]`) as HTMLElement | null;
                    if (tbody) {
                        tbody.append(createStrideRow(updated));
                    }

                    if (targetCard) {
                        updateStrideTotalEffortFromDom(targetCard);
                        removeNoItemsPlaceholder(targetCard);
                    }
                });
            });
        }

        // Progress Stride
        if (button.classList.contains('progress-stride-btn')) {
            const strideId = parseInt(button.dataset.strideId!, 10);

            if (!(await promptProgressStride(strideId))) return;

            try {
                await progressStride(owner, project, strideId);

                const successElement = document.querySelector('#success-text');
                if (successElement) successElement.textContent = '';

                const { moved, targetVisible } = preserveScroll(() =>
                    progressStrideDomUpdate(strideId)
                ) as { moved: number; targetVisible: boolean };

                if (successElement) {
                    if (moved === 0) {
                        successElement.textContent = 'Stride progressed. No unfinished moments to move.';
                    } else if (targetVisible) {
                        successElement.textContent = `Stride progressed. Moved ${moved} moment(s) to the next stride.`;
                    } else {
                        successElement.textContent = `Stride progressed. Moved ${moved} moment(s) to the next stride (not shown on this page).`;
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
 * @param {Record<string, unknown>[]} moments - The array of moment objects.
 * @returns {number} The sum of effort estimate values.
 */
function totalEffort(moments: Record<string, unknown>[]): number {
    return moments.reduce((sum, m) => sum + (estimateValues[m.effortEstimate as string] || 0), 0);
}

/* ---------- Main export ---------- */
/**
 * Load and render the strides listing page for the latest iteration, including stride cards and backlog.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Record<string, unknown> | null} permission - The user's permission object.
 */
export async function loadStridesList(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: Record<string, unknown> | null): Promise<void> {
    const strideBoard = document.querySelector('#stride-board')!;
    const backlogSection = document.querySelector('#backlog-section');
    const errorElement = document.querySelector('#error-text')!;
    const projectTitle = document.querySelector('#project-title');
    const createStrideButton = document.querySelector('#create-stride-btn');
    const createStrideButtonLabel = document.querySelector('#create-stride-btn-label');

    _state.cachedOwner = owner;
    _state.cachedProject = project;
    strideBoard.innerHTML = renderLoadingSpinner('Loading strides');
    errorElement.textContent = '';
    if (backlogSection) backlogSection.innerHTML = '';

    bindBoardCollapseToggles(strideBoard);
    if (backlogSection) bindBoardCollapseToggles(backlogSection);
    bindStrideStickyOffsetSync();

    const canEdit = permission?.permission === 'Edit';

    if (createStrideButton) {
        if (!canEdit) {
            createStrideButton.classList.add('d-none');
        } else if (createStrideButton.dataset.bound !== '1') {
            createStrideButton.dataset.bound = '1';
            createStrideButton.addEventListener('click', () => {
            if (_state.cachedIterations.length === 0) {
                openIterationCreateModal(owner, project, () => loadStridesList(owner, project, navContentDiv, contentDiv, permission));
                return;
            }

            const latestIteration = _state.cachedIterations[0];
            openStrideCreateModal({
                owner,
                project,
                iterationId: latestIteration.id as number,
                iterations: _state.cachedIterations,
                existingStrides: _state.cachedAllStrides,
                onCreated: () => loadStridesList(owner, project, navContentDiv, contentDiv, permission),
            });
        });
    }
    }

    try {
        let projectData;
        try {
            projectData = await getProject(owner, project);
        } catch {
            // projectData stays undefined
        }
        const iterations = await getIterations(owner, project);

        _state.cachedIterations = Array.isArray(iterations) ? [...iterations].toSorted((a, b) => (b as Record<string, unknown>).id as number - (a as Record<string, unknown>).id as number) : [];

        if (_state.cachedIterations.length === 0) {
            strideBoard.innerHTML = renderEmptyStateSection({
                icon: 'bi-repeat',
                title: 'No iterations found for this project.',
                description: 'Create the first iteration to start planning your work.',
            });
            if (projectTitle) {
                projectTitle.innerHTML = `<h2>${escapeHtml((projectData as Record<string, unknown>)?.name as string ?? `Project ${owner}/${project}`)}</h2>`;
            }
            if (createStrideButtonLabel) {
                createStrideButtonLabel.textContent = 'Create First Iteration';
            }
            return;
        }
        const latestIteration = _state.cachedIterations[0];
        const projectName = (projectData as Record<string, unknown>)?.name as string ?? `Project ${owner}/${project}`;
        projectTitle.innerHTML = `<h2>${escapeHtml(projectName)} – ${escapeHtml(latestIteration.name as string)}</h2>`;
        if (createStrideButtonLabel) {
            createStrideButtonLabel.textContent = 'New Stride';
        }

        const historyLink = document.querySelector('#iteration-history-link');
        if (historyLink) {
            historyLink.addEventListener('click', () => {
                navigate(`/${owner}/${project}/iterations`, navContentDiv, contentDiv);
            });
        }
        
        const [strides, backlogMoments] = await Promise.all([
            getStridesByIteration(owner, project, latestIteration.id as number),
            getMomentsByIteration(owner, project, latestIteration.id as number, true)
        ]);

        strideBoard.innerHTML = '';

        let results: { stride: Record<string, unknown>; moments: Record<string, unknown>[] }[] = [];
        const allStrides = strides as Record<string, unknown>[];

        if (!allStrides || allStrides.length === 0) {
            strideBoard.innerHTML = renderEmptyStateSection({
                icon: 'bi-kanban',
                title: 'No strides found for this iteration.',
                description: 'Create a stride to organize your moments into sprints.',
            });
        } else {
            renderStrideScrollspy(allStrides);
            const stridePromises = allStrides.map(async stride => {
                try {
                    const moments = await getMomentsByStride(owner, project, stride.id as number);
                    return { stride, moments };
                } catch (error) {
                    console.error('Failed to load moments for stride', stride.id, error);
                    return { stride, moments: [] };
                }
            });
            results = await Promise.all(stridePromises);
        }

        // Render stride cards
        let cardIndex = 0;
        for (const { stride, moments } of results) {
            const index = cardIndex;
            const isCollapsed = index !== 0;
            const card = document.createElement('div');
            card.className = `stride-card${isCollapsed ? ' is-collapsed' : ''}`;
            card.dataset.strideId = String(stride.id);
            card.id = `stride-card-${stride.id}`;
            card.dataset.collapsibleBoard = '1';
            const effTotal = totalEffort(moments);
            card.innerHTML = `
                <div class="stride-header">
                    <div class="stride-header-main">
                        ${boardToggleButtonHtml(isCollapsed)}
                        <h3>${escapeHtml(stride.name as string)}</h3>
                        <span class="stride-dates">${formatDate(stride.startDate as string)} – ${formatDate(stride.endDate as string)}</span>
                        <span class="stride-duration">(${stride.durationDays as string} days)</span>
                        <span class="stride-countdown" data-end-date="${stride.endDate as string}"></span>
                        <span class="stride-total-effort">Total Effort: ${effTotal}</span>
                    </div>
                    <div class="stride-header-actions ms-auto">
                        <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${stride.id as string}" type="button"><span aria-hidden="true">🧟</span> Progress</button>
                    </div>
                </div>
                <div class="stride-moments${isCollapsed ? ' hidden' : ''}">
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
                                    <tr data-moment-id="${m.sequenceNumber as string}">
                                        <td>${escapeHtml(m.statement as string)}</td>
                                        <td>${momentTypeDropdownHtml(m.sequenceNumber as number | string, m.type as string)}</td>
                                        <td><span class="status-badge status-${((m.status as string) || '').toLowerCase()}">${m.status as string}</span></td>
                                        <td>
                                            <select class="estimate-dropdown" data-moment-id="${m.sequenceNumber as string}" data-current-estimate="${(m.effortEstimate as string | null) ?? ''}" aria-label="Effort estimate"></select>
                                        </td>
                                        <td>
                                            <select class="owner-dropdown" data-moment-id="${m.sequenceNumber as string}" data-owner-id="${(m.ownerId as string | null) ?? ''}" aria-label="Owner"></select>
                                        </td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="status-dropdown form-select form-select-sm" data-moment-id="${m.sequenceNumber as string}" data-current-status="${(m.status as string | null) ?? ''}" aria-label="Status"></select>
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${m.sequenceNumber as string}" data-current-estimate="${(m.effortEstimate as string | null) ?? ''}" aria-label="Effort estimate"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${m.sequenceNumber as string}" type="button">Backlog</button>
                ${momentGraphLinkHtml(m.sequenceNumber as number | string)}
                <a href="/${owner}/${project}/moments/${m.sequenceNumber as string}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`
                    }
                </div>
            `;
            strideBoard.append(card);
            // Populate dropdowns inside the newly created card using DOM option creation
            populateSelectsWithin(card);
            cardIndex++;
        }

        // Render Backlog
        if (backlogSection) {
            const backlogCollapsed = allStrides && allStrides.length > 0;
            if (!backlogMoments || (backlogMoments as Record<string, unknown>[]).length === 0) {
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
                                    ${(backlogMoments as Record<string, unknown>[]).map(m => `
                                        <tr data-moment-id="${m.sequenceNumber as string}">
                                            <td>${escapeHtml(m.statement as string)}</td>
                                            <td>${momentTypeDropdownHtml(m.sequenceNumber as number | string, m.type as string)}</td>
                                            <td><span class="status-badge status-${((m.status as string) || '').toLowerCase()}">${m.status as string}</span></td>
                                            <td>${m.effortEstimate ?? '–'}</td>
                                            <td>
                                                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                    <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${m.sequenceNumber as string}"></select>
                                                    <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${m.sequenceNumber as string}" type="button">Move</button>
                                                    ${momentGraphLinkHtml(m.sequenceNumber as number | string)}
                                                    <a href="/${owner}/${project}/moments/${m.sequenceNumber as string}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
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
        try {
            const members = await getProjectMembers(owner, project);
            _state.cachedMembers = Array.isArray(members) ? members : [];
            // Populate all owner dropdowns now that we have members
            for (const dropdown of document.querySelectorAll('.owner-dropdown')) {
                populateOwnerSelect(dropdown as HTMLSelectElement);
            }
        } catch (error) {
            console.error('Failed to load project members', error);
        }

        // Fetch permission and update UI
        try {
            const level = await getMyPermission(owner, project);
            _state.isCachedCanEdit = (level && (level.toLowerCase() === 'edit' || level.toLowerCase() === 'owner')) as boolean;

            applyPermissionUI(_state.isCachedCanEdit); // ✅ SINGLE source of truth
        } catch (error) {
            console.error('Failed to get permission', error);
        }

        // Update countdowns
        updateCountdowns();

        // Cache stride list for backlog move dropdowns (no refetch needed for later DOM inserts)
        _state.cachedAllStrides = Array.isArray(allStrides) ? allStrides : [];
        renderStrideScrollspy(_state.cachedAllStrides);
        // Ensure any backlog selects reflect the cached strides
        for (const s of document.querySelectorAll('.backlog-target-stride')) {
            populateBacklogStrideSelect(s as HTMLSelectElement);
        }

        // Attach planning event listeners (inline updates only; no full reload)
        attachPlanningListeners(owner, project, navContentDiv, contentDiv);
    } catch (error) {
        strideBoard.innerHTML = '';
        errorElement.textContent = 'Failed to load data.';
        console.error(error);
    }
}

/* ---------- Event listeners ---------- */
/**
 * Attach inline moment control event listeners to the stride board and backlog section.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function attachPlanningListeners(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const strideBoard = document.querySelector('#stride-board')!;
    const backlogSection = document.querySelector('#backlog-section');

    bindInlineMomentControls(strideBoard, owner, project, navContentDiv, contentDiv);
    bindInlineMomentControls(backlogSection, owner, project, navContentDiv, contentDiv);
}

/**
 * Create a DOM option element.
 * @param {string|null} value - The option value.
 * @param {string|null} text - The option display text.
 * @param {boolean} isSelected - Whether the option is selected.
 * @returns {HTMLOptionElement} The option element.
 */
function createOption(value: string | null, text: string | null, isSelected: boolean): HTMLOptionElement {
    const opt = document.createElement('option');
    opt.value = String(value ?? '');
    opt.textContent = text ?? '';
    if (isSelected) opt.selected = true;
    return opt;
}

const estimateOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/**
 * Populate an estimate dropdown with t-shirt size options based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateEstimateSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const current = select.dataset.currentEstimate || select.value || '';
    select.innerHTML = '';
    select.append(createOption('', '–', current === ''));
    for (const k of estimateOrder) select.append(createOption(k, k, String(current) === String(k)));
}

/**
 * Populate a status dropdown with status options based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateStatusSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const current = select.dataset.currentStatus || select.value || '';
    select.innerHTML = '';
    for (const opt of STATUS_OPTIONS) {
        select.append(createOption(opt.value, `${opt.icon} ${opt.label}`, current === opt.value));
    }
}

/**
 * Populate an owner dropdown with project members based on the current value.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateOwnerSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const previous = select.value || select.dataset.ownerId || '';
    select.innerHTML = '';
    select.append(createOption('', 'Unassigned', previous === ''));
    const cachedMembersList = _state.cachedMembers || [];
    for (const member of cachedMembersList) {
        select.append(createOption(String((member as Record<string, unknown>).userId), (member as Record<string, unknown>).userName as string, String(previous) === String((member as Record<string, unknown>).userId)));
    }
    // If previous isn't valid, ensure default
    if ([...select.options].every(o => o.value !== String(previous))) {
        select.value = '';
    }
}

/**
 * Populate a backlog target stride dropdown with cached stride options.
 * @param {HTMLSelectElement} select - The select element to populate.
 */
function populateBacklogStrideSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const previous = select.value || '';
    select.innerHTML = '';
    const allCachedStrides = _state.cachedAllStrides || [];
    for (const stride of allCachedStrides) {
        select.append(createOption(String((stride as Record<string, unknown>).id), (stride as Record<string, unknown>).name as string, String(previous) === String((stride as Record<string, unknown>).id)));
    }
    if ([...select.options].every(o => o.value !== String(previous))) select.value = (select.options[0] && select.options[0].value) || '';
}

/**
 * Populate all estimate, status, owner, and backlog stride selects within a root element.
 * @param {HTMLElement} root - The root element containing the selects.
 */
function populateSelectsWithin(root: HTMLElement): void {
    if (!root) return;
    for (const element of root.querySelectorAll('.estimate-dropdown')) { populateEstimateSelect(element as HTMLSelectElement); }
    for (const element of root.querySelectorAll('.estimate-dropdown-mobile')) { populateEstimateSelect(element as HTMLSelectElement); }
    for (const element of root.querySelectorAll('.status-dropdown')) { populateStatusSelect(element as HTMLSelectElement); }
    for (const element of root.querySelectorAll('.owner-dropdown')) { populateOwnerSelect(element as HTMLSelectElement); }
    for (const element of root.querySelectorAll('.backlog-target-stride')) { populateBacklogStrideSelect(element as HTMLSelectElement); }
}

/**
 * Format a date string as a human-readable short date (e.g. "Jan 1, 2023").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date, or "N/A" if invalid.
 */
function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Update all stride countdown elements with the remaining days until the end date.
 */
function updateCountdowns(): void {
    for (const element of document.querySelectorAll('.stride-countdown')) {
        const endDate = new Date((element as HTMLElement).dataset.endDate!);
        const now = new Date();
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        element.classList.remove('stride-countdown--ended', 'stride-countdown--ending', 'stride-countdown--healthy');
        if (diffDays < 0) {
            element.textContent = 'Ended';
            element.classList.add('stride-countdown--ended');
        } else if (diffDays === 0) {
            element.textContent = 'Ends today';
            element.classList.add('stride-countdown--ending');
        } else if (diffDays <= 3) {
            element.textContent = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
            element.classList.add('stride-countdown--ending');
        } else {
            element.textContent = `${diffDays} days left`;
            element.classList.add('stride-countdown--healthy');
        }
    }
}
