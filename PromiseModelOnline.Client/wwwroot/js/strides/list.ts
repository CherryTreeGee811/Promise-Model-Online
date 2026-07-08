import { assignMomentToStride, updateMomentStatus, updateMomentEstimate, updateMomentOwner, updateMomentType } from '../moments/api.ts';
import { getProject } from '../projects/api.ts';
import { buildGraphViewHref } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { showToast } from '../ui/toast.ts';
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { renderLoadingSpinner, createConfirmationPromise } from '../utils/html.ts';
import { openIterationCreateModal } from '../utils/iteration-create-modal.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';
import { openStrideCreateModal } from '../utils/stride-create-modal.ts';

import { getIterations, getStridesByIteration, getMomentsByStride, getMomentsByIteration, getProjectMembers, getMyPermission, progressStride } from './api.ts';

const EFFORT_ESTIMATE_LABEL = 'Effort estimate';
const IS_COLLAPSED = 'is-collapsed';
const BTN_SM_CLASSES = 'btn btn-sm btn-outline-primary';

/* ---------- T‑shirt size to numeric mapping ---------- */
const estimateValues: Record<string, number> = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

const _state: {
    cachedMembers: Record<string, unknown>[];
    cachedAllStrides: Record<string, unknown>[];
    cachedIterations: Record<string, unknown>[];
    isCachedCanEdit: boolean;
    cachedOwner?: string;
    cachedProject?: string;
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
export function applyPermissionUI(canEdit: boolean): void {
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
export function getStrideStartDateValue(stride: Record<string, unknown>): number {
    const d = new Date(stride?.startDate as string);
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : 0;
}

/**
 * Find the ID of the next stride after the given one, sorted by start date.
 * @param {number|string} currentStrideId - The ID of the current stride.
 * @returns {number|undefined} The next stride ID, or undefined if none found.
 */
function findNextStrideIdInIteration(currentStrideId: number | string): number | undefined {
    const strides = Array.isArray(_state.cachedAllStrides) ? [..._state.cachedAllStrides] : [];
    strides.sort((a, b) => getStrideStartDateValue(a) - getStrideStartDateValue(b));
    const index = strides.findIndex(s => String(s?.id) === String(currentStrideId));
    if (index === -1) return;
    const next = strides[index + 1];
    return next?.id as number | undefined;
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

    momentsContainer.replaceChildren(renderEmptyStateSection({
        icon: 'bi-clock',
        title: 'No moments assigned.',
        description: 'Move moments from the backlog into this stride.',
    }));
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
    const currentCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(String(strideId))}"]`) as HTMLElement | null;
    if (!currentCard) return { moved: 0, targetVisible: false };

    const nextStrideId = findNextStrideIdInIteration(strideId);
    let targetCard;
    if (nextStrideId) {
        targetCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(String(nextStrideId))}"]`) as HTMLElement;
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
    const targetTbody = ensureStrideTbody(nextStrideId!);
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
 * @param {string} currentEstimate - The current estimate value.
 * @returns {string} The HTML string for the dropdown.
 */
function estimateDropdownHtml(momentSeq: number | string, currentEstimate: string | null): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'estimate-dropdown';
    select.dataset.momentId = String(momentSeq);
    select.dataset.currentEstimate = currentEstimate ?? '';
    select.setAttribute('aria-label', EFFORT_ESTIMATE_LABEL);
    return select;
}

/**
 * @param {number | string} momentSeq - Moment sequence number
 * @param {number | string | null} ownerId - Owner ID
 * @returns {HTMLSelectElement} The owner dropdown element
 */
function ownerDropdownHtml(momentSeq: number | string, ownerId: number | string | null): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'owner-dropdown';
    select.dataset.momentId = String(momentSeq);
    select.dataset.ownerId = String(ownerId ?? '');
    select.setAttribute('aria-label', 'Owner');
    return select;
}

/**
 * @param {number | string} momentId - Moment ID
 * @param {string} currentType - Current moment type
 * @returns {HTMLSelectElement} The type dropdown element
 */
function momentTypeDropdownHtml(momentId: number | string, currentType: string): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'moment-type-dropdown form-select form-select-sm';
    select.dataset.momentId = String(momentId);
    select.dataset.currentType = currentType;
    select.setAttribute('aria-label', 'Moment type');
    const optStory = document.createElement('option');
    optStory.value = 'Story';
    optStory.textContent = 'Story';
    if (currentType === 'Story') optStory.selected = true;
    select.append(optStory);
    const optJob = document.createElement('option');
    optJob.value = 'Job';
    optJob.textContent = 'Job';
    if (currentType === 'Job') optJob.selected = true;
    select.append(optJob);
    return select;
}

/**
 * @param {number | string} momentSeq - Moment sequence number
 * @param {string | null} status - Current status
 * @returns {HTMLSelectElement} The status dropdown element
 */
function statusDropdownHtml(momentSeq: number | string, status: string | null): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'status-dropdown';
    select.dataset.momentId = String(momentSeq);
    select.dataset.currentStatus = status ?? '';
    select.setAttribute('aria-label', 'Status');
    return select;
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
    badge.classList.add(`status-${safeStatus.toLowerCase()}`);
}

/**
 * Get the content element (moments container or backlog content) within a board.
 * @param {HTMLElement} board - The board element (stride card or backlog).
 * @returns {HTMLElement} The content element, or null.
 */
function boardContentElement(board: HTMLElement): HTMLElement | null {
    return board?.querySelector('.stride-moments, .backlog-content');
}

/**
 * Generate HTML for the collapse/expand toggle button of a board.
 * @param {boolean} isCollapsed - Whether the board is currently collapsed.
 * @returns {string} The HTML string for the toggle button.
 */
function boardToggleButtonHtml(isCollapsed: boolean): HTMLButtonElement {
    const iconClass = isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up';
    const label = isCollapsed ? 'Expand board' : 'Collapse board';
    const button = document.createElement('button');
    button.className = 'stride-toggle-btn';
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(!isCollapsed));
    const icon = document.createElement('i');
    icon.className = `bi ${iconClass}`;
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    return button;
}

/**
 * Generate DOM for a board header with toggle button, title, and optional actions.
 * @param {string} title - The board title.
 * @param {boolean} isCollapsed - Whether the board is collapsed.
 * @param {HTMLElement|undefined} [extraActionsElement] - Optional extra action buttons element.
 * @returns {HTMLElement} The header DOM element.
 */
function boardHeaderHtml(title: string, isCollapsed: boolean, extraActionsElement?: HTMLElement): HTMLElement {
    const div = document.createElement('div');
    div.className = 'stride-header';
    const mainDiv = document.createElement('div');
    mainDiv.className = 'stride-header-main';
    mainDiv.append(boardToggleButtonHtml(isCollapsed));
    const h3 = document.createElement('h3');
    h3.textContent = title;
    mainDiv.append(h3);
    div.append(mainDiv);
    if (extraActionsElement) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'stride-header-actions ms-auto';
        actionsDiv.append(extraActionsElement);
        div.append(actionsDiv);
    }
    return div;
}

/**
 * Set the collapsed state of a board and update its toggle button appearance.
 * @param {HTMLElement} board - The board element.
 * @param {boolean} isCollapsed - Whether to collapse the board.
 */
function setBoardCollapsed(board: HTMLElement, isCollapsed: boolean): void {
    if (!board) return;

    board.classList.toggle(IS_COLLAPSED, isCollapsed);

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
        toggleButton.setAttribute('aria-pressed', String(!isCollapsed));
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
        nav.replaceChildren();
        nav.classList.add('d-none');
        return;
    }

    nav.classList.remove('d-none');
    nav.replaceChildren();

    const wrapper = document.createElement('div');
    wrapper.className = 'position-sticky top-0 bg-body border rounded p-2 shadow-sm';
    const label = document.createElement('div');
    label.className = 'small text-uppercase text-secondary mb-2';
    label.textContent = 'Current Strides';
    wrapper.append(label);
    const links = document.createElement('nav');
    links.id = 'stride-scrollspy-links';
    links.className = 'nav nav-pills flex-wrap gap-2';
    wrapper.append(links);
    nav.append(wrapper);
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

    const spyApi = bootstrap?.ScrollSpy as { getOrCreateInstance: (element: Element, options?: Record<string, unknown>) => { refresh?: () => void } } | undefined;
    if (spyApi) {
        const spy = spyApi.getOrCreateInstance(document.body, {
            target: '#stride-scrollspy-links',
            offset: 140,
        });
        spy.refresh?.();
    }

    if ((nav as HTMLElement).dataset.boundScrollspyClick !== '1') {
        (nav as HTMLElement).dataset.boundScrollspyClick = '1';
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
 * @returns {HTMLElement | undefined} The link element, or undefined if unavailable.
 */
function momentGraphLinkHtml(seqNumber: number | string): HTMLElement | undefined {
    const href = buildGraphViewHref(_state.cachedOwner!, _state.cachedProject!, `moment-${seqNumber}`);
    if (!href) return;

    const a = document.createElement('a');
    a.href = href;
    a.className = BTN_SM_CLASSES;
    a.setAttribute('aria-label', `Open graph view focused on moment ${seqNumber}`);
    const index = document.createElement('i');
    index.className = 'bi bi-diagram-3';
    index.setAttribute('aria-hidden', 'true');
    a.append(index);
    const span = document.createElement('span');
    span.textContent = 'Graph View';
    a.append(span);
    return a;
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
    let modalElement = document.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
    if (modalElement) return modalElement;

    modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = id;
    modalElement.tabIndex = -1;
    modalElement.setAttribute('aria-hidden', 'true');

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const h5 = document.createElement('h5');
    h5.className = 'modal-title';
    h5.textContent = title;
    header.append(h5);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.dataset.bsDismiss = 'modal';
    closeButton.setAttribute('aria-label', 'Close');
    header.append(closeButton);
    content.append(header);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const p = document.createElement('p');
    p.className = 'mb-0';
    p.id = `${id}-text`;
    body.append(p);
    content.append(body);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-outline-secondary';
    cancelButton.dataset.bsDismiss = 'modal';
    cancelButton.textContent = 'Cancel';
    footer.append(cancelButton);
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = `btn ${confirmClass}`;
    confirmButton.id = `${id}-confirm`;
    confirmButton.textContent = confirmText;
    footer.append(confirmButton);
    content.append(footer);

    dialog.append(content);
    modalElement.append(dialog);
    document.body.append(modalElement);
    return modalElement;
}

/**
 * Show a confirmation dialog for moving a moment.
 * @param {number|string} _momentId - The moment ID to move.
 * @param {string} modalPrefix - The modal element ID prefix.
 * @param {string} message - The confirmation message text.
 * @param {() => Promise<unknown>} onConfirm - The async callback to execute on confirmation.
 */
function promptMoveConfirm(_momentId: number | string, modalPrefix: string, message: string, onConfirm: () => Promise<unknown>): void {
    const modalElement = document.querySelector('#' + modalPrefix) as HTMLElement | null;
    if (!modalElement) return;
    const modalText = modalElement.querySelector('#' + modalPrefix + '-text');
    const confirmButton = modalElement.querySelector('#' + modalPrefix + '-confirm');
    if (!modalText || !confirmButton) return;

    modalText.textContent = message;

    const nextButton = confirmButton.cloneNode(true) as HTMLElement;
    confirmButton.parentElement!.replaceChild(nextButton, confirmButton);
    nextButton.addEventListener('click', async () => {
        (nextButton as HTMLInputElement).disabled = true;
        try {
            await onConfirm();
            bootstrap?.Modal?.getOrCreateInstance?.(modalElement)?.hide();
        } catch (error) {
            console.error(error);
            showToast('Failed to move moment', 'error');
        } finally {
            (nextButton as HTMLInputElement).disabled = false;
        }
    }, { once: true });

    bootstrap?.Modal?.getOrCreateInstance?.(modalElement)?.show();
}

/**
 * Show a confirmation dialog for moving a moment to the backlog.
 * @param {number|string} momentId - The moment ID to move.
 * @param {() => Promise<unknown>} onConfirm - The async callback to execute on confirmation.
 */
function promptMoveToBacklog(momentId: number | string, onConfirm: () => Promise<unknown>): void {
    promptMoveConfirm(momentId, 'move-to-backlog-modal', 'Move ' + truncateMomentStatement(momentId) + ' to the Backlog?', onConfirm);
}

/**
 * Show a confirmation dialog for moving a moment to a specific stride.
 * @param {number|string} momentId - The moment ID to move.
 * @param {() => Promise<unknown>} onConfirm - The async callback to execute on confirmation.
 */
function promptMoveToStride(momentId: number | string, onConfirm: () => Promise<unknown>): void {
    promptMoveConfirm(momentId, 'move-to-stride-modal', 'Move ' + truncateMomentStatement(momentId) + ' to the selected stride?', onConfirm);
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

    const strideCard = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(String(strideId))}"]`);
    const strideName = strideCard?.querySelector(':scope .stride-header h3')?.textContent?.trim();
    modalText.textContent = strideName
        ? `Move all unfinished moments in ${strideName} to the next stride?`
        : 'Move all unfinished moments to the next stride?';

    return createConfirmationPromise(modalElement, confirmButton as HTMLElement);
}

/**
 * Show a confirmation dialog for moving a moment to a specific stride.
/**
 * Get a truncated (35 chars) statement text for a moment by its ID.
 * @param {number|string} momentId - The moment ID.
 * @returns {string} The truncated statement, or a fallback string.
 */
function truncateMomentStatement(momentId: number | string): string {
    const row = findMomentRow(momentId);
    const statementCell = row?.querySelector('td');
    const statement = (statementCell?.textContent ?? '').trim();
    if (!statement) return 'moment ' + momentId;
    return statement.slice(0, 35);
}

/**
 * Find a moment table row element by its data-moment-id attribute.
 * @param {number|string} momentId - The moment ID.
 * @returns {HTMLElement} The table row element, or null.
 */
function findMomentRow(momentId: number | string): HTMLElement | null {
    return document.querySelector(`tr[data-moment-id="${CSS.escape(String(momentId))}"]`);
}

/**
 * Handle a status dropdown change by updating the moment status via the API.
 * @param {HTMLSelectElement} select - The status dropdown element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function handleStatusChange(select: HTMLSelectElement, owner: string, project: string): Promise<void> {
    const momentId = Number(select.dataset.momentId!);
    const flowId = Number((select.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    const previous = select.value;
    const restoreSelect = select;
    try {
        const updated = await updateMomentStatus(owner, project, momentId, select.value, flowId) as Record<string, unknown>;
        const row = findMomentRow(momentId);
        if (row) updateStatusBadge(row, updated.status as string);
    } catch {
        restoreSelect.value = previous;
        showToast('Failed to update status', 'error');
    }
}

/**
 * Handle an estimate dropdown change by updating the moment estimate via the API.
 * @param {HTMLSelectElement} select - The estimate dropdown element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function handleEstimateChange(select: HTMLSelectElement, owner: string, project: string): Promise<void> {
    const momentId = Number(select.dataset.momentId!);
    const flowId = Number((select.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    const previous = select.value;
    const restoreSelect = select;
    try {
        const estimate = select.value === '' ? undefined : select.value;
        await updateMomentEstimate(owner, project, momentId, estimate, flowId);
        const row = findMomentRow(momentId);
        const card = row?.closest('.stride-card') as HTMLElement | null;
        if (card) updateStrideTotalEffortFromDom(card);
    } catch {
        restoreSelect.value = previous;
        showToast('Failed to update estimate', 'error');
    }
}

/**
 * Handle an owner dropdown change by updating the moment owner via the API.
 * @param {HTMLSelectElement} select - The owner dropdown element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function handleOwnerChange(select: HTMLSelectElement, owner: string, project: string): Promise<void> {
    const momentId = Number(select.dataset.momentId!);
    const flowId = Number((select.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    const previous = select.value;
    const restoreSelect = select;
    try {
        let newOwnerId: number | undefined;
        if (select.value) newOwnerId = Number(select.value);
        const updated = await updateMomentOwner(owner, project, momentId, newOwnerId ?? 0, flowId) as Record<string, unknown>;
        restoreSelect.value = String(updated.ownerId ?? '');
    } catch {
        restoreSelect.value = previous;
        showToast('Failed to update owner', 'error');
    }
}

/**
 * Handle a moment type dropdown change by updating the moment type via the API.
 * @param {HTMLSelectElement} select - The type dropdown element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function handleTypeChange(select: HTMLSelectElement, owner: string, project: string): Promise<void> {
    const momentId = Number(select.dataset.momentId!);
    const flowId = Number((select.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    const newType = select.value;
    const writeTo = select;
    const previous = select.dataset.currentType || newType;
    try {
        await updateMomentType(owner, project, momentId, newType, flowId);
        writeTo.dataset.currentType = newType;
    } catch {
        writeTo.value = previous;
        showToast('Failed to update type', 'error');
    }
}

/**
 * Handle a click on a moment view link and navigate to the moment detail page.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<boolean>} Whether a view link was clicked and navigation occurred.
 */
async function handleViewNav(event: MouseEvent, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<boolean> {
    const viewLink = (event.target as HTMLElement).closest('a[data-moment-view]');
    if (viewLink) {
        event.preventDefault();
        void navigate(viewLink.getAttribute('href')!, navContentDiv, contentDiv);
        return true;
    }
    return false;
}

/**
 * Handle a click on the "Move to Backlog" button, prompting for confirmation.
 * @param {HTMLElement} button - The move-to-backlog button element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
export async function handleMoveToBacklog(button: HTMLElement, owner: string, project: string): Promise<void> {
    const momentId = Number(button.dataset.momentId!);
    const flowId = Number((button.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    promptMoveToBacklog(momentId, async () => {
        const updated = await assignMomentToStride(owner, project, momentId, undefined, flowId) as Record<string, unknown>;
        preserveScroll(() => {
            const row = findMomentRow(momentId);
            const origCard = row?.closest('.stride-card') as HTMLElement | null;
            if (row) row.remove();
            const tbody = ensureBacklogTbody();
            if (tbody) tbody.append(createBacklogRow(updated));
            if (origCard) {
                updateStrideTotalEffortFromDom(origCard);
                ensureNoItemsPlaceholder(origCard);
            }
        });
    });
}

/**
 * Handle a click on the "Move to Stride" button, prompting for confirmation.
 * @param {HTMLElement} button - The move-to-stride-from-backlog button element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
export async function handleMoveToStride(button: HTMLElement, owner: string, project: string): Promise<void> {
    const momentId = Number(button.dataset.momentId!);
    const flowId = Number((button.closest('[data-flow-id]') as HTMLElement | null)?.dataset.flowId) || undefined;
    const row = button.closest('tr') as HTMLElement | null;
    const select = row?.querySelector('.backlog-target-stride') as HTMLSelectElement | null;
    let strideId: number | undefined;
    if (select) strideId = Number(select.value);
    if (!strideId) return;
    promptMoveToStride(momentId, async () => {
        const updated = await assignMomentToStride(owner, project, momentId, strideId, flowId) as Record<string, unknown>;
        preserveScroll(() => {
            findMomentRow(momentId)?.remove();
            const tbody = ensureStrideTbody(strideId);
            const targetCard = document.querySelector('.stride-card[data-stride-id="' + CSS.escape(String(strideId)) + '"]') as HTMLElement | null;
            if (tbody) tbody.append(createStrideRow(updated));
            if (targetCard) {
                updateStrideTotalEffortFromDom(targetCard);
                removeNoItemsPlaceholder(targetCard);
            }
        });
    });
}

/**
 * Handle a click on the "Progress Stride" button, prompting for confirmation.
 * @param {HTMLElement} button - The progress-stride button element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
export async function handleProgressStride(button: HTMLElement, owner: string, project: string): Promise<void> {
    const strideId = Number(button.dataset.strideId!);
    if (!(await promptProgressStride(strideId))) return;
    try {
        await progressStride(owner, project, strideId);
        const successElement = document.querySelector('#success-text');
        if (successElement) successElement.textContent = '';
        const { moved, targetVisible: isTargetVisible } = preserveScroll(() =>
            progressStrideDomUpdate(strideId)
        ) as { moved: number; targetVisible: boolean };
        if (successElement) {
            if (moved === 0) {
                successElement.textContent = 'Stride progressed. No unfinished moments to move.';
            } else if (isTargetVisible) {
                successElement.textContent = 'Stride progressed. Moved ' + moved + ' moment(s) to the next stride.';
            } else {
                successElement.textContent = 'Stride progressed. Moved ' + moved + ' moment(s).';
            }
        }
    } catch (error) {
        console.error('Failed to progress stride', error);
        showToast('Failed to progress stride', 'error');
    }
}

/**
 * Handle click events on stride action buttons (move to backlog, move to stride, progress stride).
 * @param {MouseEvent} event - The click event.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleStrideActions(event: MouseEvent, owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    if (await handleViewNav(event, navContentDiv, contentDiv)) return;
    const button = (event.target as HTMLElement).closest('.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn') as HTMLElement | null;
    if (!button) return;
    if (button.classList.contains('move-to-backlog-btn')) {
        await handleMoveToBacklog(button, owner, project);
    } else if (button.classList.contains('move-to-stride-from-backlog-btn')) {
        await handleMoveToStride(button, owner, project);
    } else if (button.classList.contains('progress-stride-btn')) {
        await handleProgressStride(button, owner, project);
    }
}

/**
 * Create a table element with a header row from an array of column names.
 * @param {string[]} headers - The column header texts.
 * @returns {HTMLTableElement} The new table element with thead and an empty tbody.
 */
function createHeaderedTable(headers: string[]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'promisemodel-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const thText of headers) {
        const th = document.createElement('th');
        th.textContent = thText;
        headerRow.append(th);
    }
    thead.append(headerRow);
    table.append(thead);
    const tbody = document.createElement('tbody');
    table.append(tbody);
    return table;
}

/**
 * Ensure the backlog section has a table tbody element, creating the board structure if needed.
 * @returns {HTMLElement|undefined} The backlog tbody element, or undefined.
 */
function ensureBacklogTbody(): HTMLElement | undefined {
    const backlogSection = document.querySelector('#backlog-section');
    if (!backlogSection) return;

    const tbody = backlogSection.querySelector(':scope .backlog-content table.promisemodel-table tbody') as HTMLElement | null;
    if (tbody) return tbody;

    backlogSection.replaceChildren();
    const card = document.createElement('div');
    card.className = 'stride-card backlog-board is-collapsed';
    card.dataset.collapsibleBoard = '1';
    card.append(boardHeaderHtml('Backlog', true));
    const contentDiv = document.createElement('div');
    contentDiv.className = 'stride-moments backlog-content hidden';
    const table = createHeaderedTable(['Statement', 'Type', 'Status', 'Effort', 'Actions']);
    contentDiv.append(table);
    card.append(contentDiv);
    backlogSection.append(card);
    return backlogSection.querySelector(':scope .backlog-content table.promisemodel-table tbody') as HTMLElement | undefined;
}

/**
 * Create a table row element for a backlog moment.
 * @param {Record<string, unknown>} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createBacklogRow(moment: Record<string, unknown>): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(moment.sequenceNumber);
    tr.dataset.flowId = String(moment.flowId ?? '');

    const tdStatement = document.createElement('td');
    tdStatement.textContent = moment.statement as string;
    tr.append(tdStatement);

    const tdType = document.createElement('td');
    tdType.append(momentTypeDropdownHtml(moment.sequenceNumber as number | string, moment.type as string));
    tr.append(tdType);

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${((moment.status as string) || '').toLowerCase()}`;
    statusBadge.textContent = moment.status as string;
    tdStatus.append(statusBadge);
    tr.append(tdStatus);

    const tdEffort = document.createElement('td');
    tdEffort.textContent = (moment.effortEstimate as string) ?? '–';
    tr.append(tdEffort);

    const tdActions = document.createElement('td');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-inline-flex flex-wrap gap-2 align-items-center';
    const targetSelect = document.createElement('select');
    targetSelect.className = 'backlog-target-stride form-select form-select-sm';
    targetSelect.dataset.momentId = String(moment.sequenceNumber);
    actionsDiv.append(targetSelect);
    const moveButton = document.createElement('button');
    moveButton.className = 'move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm';
    moveButton.dataset.momentId = String(moment.sequenceNumber);
    moveButton.type = 'button';
    moveButton.textContent = 'Move';
    actionsDiv.append(moveButton);
    const graphLink = momentGraphLinkHtml(moment.sequenceNumber as number | string);
    if (graphLink) actionsDiv.append(graphLink);
    const viewLink = document.createElement('a');
    viewLink.href = `/${_state.cachedOwner}/${_state.cachedProject}/moments/${moment.sequenceNumber as string}`;
    viewLink.dataset.momentView = 'true';
    viewLink.className = BTN_SM_CLASSES;
    viewLink.textContent = 'View';
    actionsDiv.append(viewLink);
    tdActions.append(actionsDiv);
    tr.append(tdActions);

    if (targetSelect) populateBacklogStrideSelect(targetSelect);
    return tr;
}

/**
 * Ensure a stride card has a table tbody element, creating the table structure if needed.
 * @param {number|string} strideId - The stride ID.
 * @returns {HTMLElement|undefined} The tbody element, or undefined.
 */
function ensureStrideTbody(strideId: number | string): HTMLElement | undefined {
    const card = document.querySelector(`.stride-card[data-stride-id="${CSS.escape(String(strideId))}"]`) as HTMLElement;
    if (!card) return;

    const tbody = card.querySelector(':scope table.promisemodel-table tbody') as HTMLElement | undefined;
    if (tbody) return tbody;

    const container = card.querySelector(':scope .stride-moments');
    if (!container) return;

    container.replaceChildren();
    const table = createHeaderedTable(['Statement', 'Type', 'Status', 'Effort', 'Owner', 'Actions']);
    container.append(table);
    return card.querySelector(':scope table.promisemodel-table tbody') as HTMLElement | undefined;
}

/**
 * Create a table row element for a moment within a stride.
 * @param {Record<string, unknown>} moment - The moment object with fields like sequenceNumber, statement, type, etc.
 * @returns {HTMLElement} The table row element.
 */
function createStrideRow(moment: Record<string, unknown>): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(moment.sequenceNumber);
    tr.dataset.flowId = String(moment.flowId ?? '');

    const tdStatement = document.createElement('td');
    tdStatement.textContent = moment.statement as string;
    tr.append(tdStatement);

    const tdType = document.createElement('td');
    tdType.append(momentTypeDropdownHtml(moment.sequenceNumber as number | string, moment.type as string));
    tr.append(tdType);

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${((moment.status as string) || '').toLowerCase()}`;
    statusBadge.textContent = moment.status as string;
    tdStatus.append(statusBadge);
    tr.append(tdStatus);

    const tdEstimate = document.createElement('td');
    tdEstimate.append(estimateDropdownHtml(moment.sequenceNumber as number | string, moment.effortEstimate as string | null));
    tr.append(tdEstimate);

    const tdOwner = document.createElement('td');
    tdOwner.append(ownerDropdownHtml(moment.sequenceNumber as number | string, moment.ownerId as number | string | null));
    tr.append(tdOwner);

    const tdActions = document.createElement('td');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-inline-flex flex-wrap gap-2 align-items-center';
    actionsDiv.append(statusDropdownHtml(moment.sequenceNumber as number | string, moment.status as string | null));
    const estimateMobile = document.createElement('select');
    estimateMobile.className = 'estimate-dropdown-mobile form-select form-select-sm';
    estimateMobile.dataset.momentId = String(moment.sequenceNumber);
    estimateMobile.dataset.currentEstimate = (moment.effortEstimate as string | null) ?? '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '–';
    estimateMobile.append(defaultOpt);
    actionsDiv.append(estimateMobile);
    const backlogButton = document.createElement('button');
    backlogButton.className = 'move-to-backlog-btn btn btn-outline-danger btn-sm';
    backlogButton.dataset.momentId = String(moment.sequenceNumber);
    backlogButton.type = 'button';
    backlogButton.textContent = 'Backlog';
    actionsDiv.append(backlogButton);
    const graphLink = momentGraphLinkHtml(moment.sequenceNumber as number | string);
    if (graphLink) actionsDiv.append(graphLink);
    const viewLink = document.createElement('a');
    viewLink.href = `/${_state.cachedOwner}/${_state.cachedProject}/moments/${moment.sequenceNumber as string}`;
    viewLink.dataset.momentView = 'true';
    viewLink.className = BTN_SM_CLASSES;
    viewLink.textContent = 'View';
    actionsDiv.append(viewLink);
    tdActions.append(actionsDiv);
    tr.append(tdActions);

    const estimateSelect = tr.querySelector('.estimate-dropdown') as HTMLSelectElement | null;
    const ownerSelect = tr.querySelector('.owner-dropdown') as HTMLSelectElement | null;
    const statusSelect = tr.querySelector('.status-dropdown') as HTMLSelectElement | null;

    if (estimateSelect) populateEstimateSelect(estimateSelect);
    if (estimateMobile) populateEstimateSelect(estimateMobile);
    if (statusSelect) populateStatusSelect(statusSelect);
    if (ownerSelect) {
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

    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    root.addEventListener('change', async (event) => {
        const target = event.target as HTMLElement;

        if (target.matches('.status-dropdown')) {
            await handleStatusChange(target as HTMLSelectElement, owner, project);
        } else if (target.matches('.estimate-dropdown') || target.matches('.estimate-dropdown-mobile')) {
            await handleEstimateChange(target as HTMLSelectElement, owner, project);
        } else if (target.matches('.owner-dropdown')) {
            await handleOwnerChange(target as HTMLSelectElement, owner, project);
        } else if (target.matches('.moment-type-dropdown')) {
            await handleTypeChange(target as HTMLSelectElement, owner, project);
        }
    });

    root.addEventListener('click', async (event) => {
        await handleStrideActions(event, owner, project, navContentDiv, contentDiv);
    });
}

/* ---------- Extracted helpers ---------- */

/**
 * Try to fetch project data, returning undefined on failure.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<Record<string, unknown> | undefined>} The project data, or undefined on failure.
 */
async function tryFetchProjectData(owner: string, project: string): Promise<Record<string, unknown> | undefined> {
    try {
        return await getProject(owner, project) as Record<string, unknown>;
    } catch {
        return undefined;
    }
}

/**
 * Set up the create-stride button: hide it if the user cannot edit, else wire the click handler.
 * @param {HTMLElement | null} strideButtonElement - The create-stride button element.
 * @param {boolean} canEdit - Whether the user has edit permission.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Record<string, unknown> | null} permission - The user's permission object.
 */
function setUpCreateStrideButton(
    strideButtonElement: HTMLElement | null,
    canEdit: boolean,
    owner: string,
    project: string,
    navContentDiv: HTMLElement,
    contentDiv: HTMLElement,
    permission: Record<string, unknown> | null,
): void {
    if (strideButtonElement) {
        if (!canEdit) {
            strideButtonElement.classList.add('d-none');
        } else if (strideButtonElement.dataset.bound !== '1') {
            strideButtonElement.dataset.bound = '1';
            strideButtonElement.addEventListener('click', () => {
                if (_state.cachedIterations.length === 0) {
                    openIterationCreateModal(owner, project, () => loadStridesList(owner, project, navContentDiv, contentDiv, permission));
                    return;
                }

                const latestIteration = _state.cachedIterations[0];
                openStrideCreateModal({
                    owner,
                    project,
                    iterationId: latestIteration.id as number,
                    iterations: _state.cachedIterations as { id: number; name: string }[],
                    existingStrides: _state.cachedAllStrides,
                    onCreated: () => loadStridesList(owner, project, navContentDiv, contentDiv, permission),
                });
            });
        }
    }
}

/**
 * Render the empty state when no iterations exist for the project.
 * @param {HTMLElement} strideBoard - The stride board container element.
 * @param {HTMLElement | null} projectTitle - The project title heading element.
 * @param {HTMLElement | null} strideButtonLabelElement - The create-stride button label element.
 * @param {Record<string, unknown> | undefined} projectData - The project data object.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 */
function handleEmptyIterations(
    strideBoard: HTMLElement,
    projectTitle: HTMLElement | null,
    strideButtonLabelElement: HTMLElement | null,
    projectData: Record<string, unknown> | undefined,
    owner: string,
    project: string,
): void {
    strideBoard.replaceChildren(renderEmptyStateSection({
        icon: 'bi-repeat',
        title: 'No iterations found for this project.',
        description: 'Create the first iteration to start planning your work.',
    }));
    if (projectTitle) {
        projectTitle.replaceChildren();
        const h2 = document.createElement('h2');
        h2.textContent = (projectData as Record<string, unknown>)?.name as string ?? ('Project ' + owner + '/' + project);
        projectTitle.append(h2);
    }
    if (strideButtonLabelElement) {
        strideButtonLabelElement.textContent = 'Create First Iteration';
    }
}

/**
 * Update the page header with the iteration name, wire the history link, and set the stride button label.
 * @param {Record<string, unknown>} latestIteration - The latest iteration object.
 * @param {Record<string, unknown> | undefined} projectData - The project data object.
 * @param {HTMLElement} projectTitle - The project title heading element.
 * @param {HTMLElement | null} strideButtonLabelElement - The create-stride button label element.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function updatePageHeader(
    latestIteration: Record<string, unknown>,
    projectData: Record<string, unknown> | undefined,
    projectTitle: HTMLElement,
    strideButtonLabelElement: HTMLElement | null,
    owner: string,
    project: string,
    navContentDiv: HTMLElement,
    contentDiv: HTMLElement,
): void {
    const projectName = (projectData as Record<string, unknown>)?.name as string ?? ('Project ' + owner + '/' + project);
    projectTitle.replaceChildren();
    const h2 = document.createElement('h2');
    h2.textContent = projectName + ' \u{2013} ' + (latestIteration.name as string);
    projectTitle.append(h2);
    if (strideButtonLabelElement) {
        strideButtonLabelElement.textContent = 'New Stride';
    }

    const historyLink = document.querySelector('#iteration-history-link');
    if (historyLink) {
        historyLink.addEventListener('click', () => {
            void navigate('/' + owner + '/' + project + '/iterations', navContentDiv, contentDiv);
        });
    }
}

/**
 * Fetch stride moments and handle the no-strides empty state.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {Record<string, unknown>[] | undefined} allStrides - The array of stride objects.
 * @param {HTMLElement} strideBoard - The stride board container element.
 * @returns {Promise<{stride: Record<string, unknown>; moments: unknown[]}[]>} The stride-moment pairs.
 */
async function loadStrideData(
    owner: string,
    project: string,
    allStrides: Record<string, unknown>[] | undefined,
    strideBoard: HTMLElement,
): Promise<{ stride: Record<string, unknown>; moments: unknown[] }[]> {
    if (!allStrides || allStrides.length === 0) {
        strideBoard.replaceChildren(renderEmptyStateSection({
            icon: 'bi-kanban',
            title: 'No strides found for this iteration.',
            description: 'Create a stride to organize your moments into sprints.',
        }));
        return [];
    }

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
    return await Promise.all(stridePromises);
}

/**
 * Render a single moment table row for a stride card.
 * @param {Record<string, unknown>} m - The moment object.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {HTMLElement} The table row element.
 */
function renderMomentRow(
    m: Record<string, unknown>,
    owner: string,
    project: string,
): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(m.sequenceNumber);
    tr.dataset.flowId = String(m.flowId ?? '');

    const tdStatement = document.createElement('td');
    tdStatement.textContent = m.statement as string;
    tr.append(tdStatement);

    const tdType = document.createElement('td');
    tdType.append(momentTypeDropdownHtml(m.sequenceNumber as number | string, m.type as string));
    tr.append(tdType);

    const tdStatus = document.createElement('td');
    const sBadge = document.createElement('span');
    sBadge.className = 'status-badge status-' + ((m.status as string) || '').toLowerCase();
    sBadge.textContent = m.status as string;
    tdStatus.append(sBadge);
    tr.append(tdStatus);

    const tdEstimate = document.createElement('td');
    const estSel = document.createElement('select');
    estSel.className = 'estimate-dropdown';
    estSel.dataset.momentId = String(m.sequenceNumber);
    estSel.dataset.currentEstimate = (m.effortEstimate as string | null) ?? '';
    estSel.setAttribute('aria-label', EFFORT_ESTIMATE_LABEL);
    tdEstimate.append(estSel);
    tr.append(tdEstimate);

    const tdOwner = document.createElement('td');
    const ownSel = document.createElement('select');
    ownSel.className = 'owner-dropdown';
    ownSel.dataset.momentId = String(m.sequenceNumber);
    ownSel.dataset.ownerId = ((m.ownerId as string | null) ?? '');
    ownSel.setAttribute('aria-label', 'Owner');
    tdOwner.append(ownSel);
    tr.append(tdOwner);

    const tdActions = document.createElement('td');
    const aDiv = document.createElement('div');
    aDiv.className = 'd-inline-flex flex-wrap gap-2 align-items-center';
    const statusSel = document.createElement('select');
    statusSel.className = 'status-dropdown form-select form-select-sm';
    statusSel.dataset.momentId = String(m.sequenceNumber);
    statusSel.dataset.currentStatus = (m.status as string | null) ?? '';
    statusSel.setAttribute('aria-label', 'Status');
    aDiv.append(statusSel);
    const estMobile = document.createElement('select');
    estMobile.className = 'estimate-dropdown-mobile form-select form-select-sm';
    estMobile.dataset.momentId = String(m.sequenceNumber);
    estMobile.dataset.currentEstimate = (m.effortEstimate as string | null) ?? '';
    estMobile.setAttribute('aria-label', EFFORT_ESTIMATE_LABEL);
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '\u{2013}';
    estMobile.append(defaultOption);
    aDiv.append(estMobile);
    const blButton = document.createElement('button');
    blButton.className = 'move-to-backlog-btn btn btn-outline-danger btn-sm';
    blButton.dataset.momentId = String(m.sequenceNumber);
    blButton.type = 'button';
    blButton.textContent = 'Backlog';
    aDiv.append(blButton);
    const graphLink = momentGraphLinkHtml(m.sequenceNumber as number | string);
    if (graphLink) aDiv.append(graphLink);
    const vLink = document.createElement('a');
    vLink.href = '/' + owner + '/' + project + '/moments/' + (m.sequenceNumber as string);
    vLink.dataset.momentView = 'true';
    vLink.className = BTN_SM_CLASSES;
    vLink.textContent = 'View';
    aDiv.append(vLink);
    tdActions.append(aDiv);
    tr.append(tdActions);

    return tr;
}

/**
 * Render a single stride card (header + moments table) and append it to the stride board.
 * @param {Record<string, unknown>} stride - The stride object.
 * @param {Record<string, unknown>[]} moments - The moments belonging to this stride.
 * @param {number} cardIndex - The index of the card (0 = first, expanded by default).
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} strideBoard - The stride board container element.
 */
function renderStrideCard(
    stride: Record<string, unknown>,
    moments: Record<string, unknown>[],
    cardIndex: number,
    owner: string,
    project: string,
    strideBoard: HTMLElement,
): void {
    const isCollapsed = cardIndex !== 0;
    const card = document.createElement('div');
    card.className = 'stride-card' + (isCollapsed ? ' is-collapsed' : '');
    card.dataset.strideId = String(stride.id);
    card.id = 'stride-card-' + String(stride.id);
    card.dataset.collapsibleBoard = '1';
    const progressButton = document.createElement('button');
    progressButton.className = 'progress-stride-btn btn btn-outline-success btn-sm hidden';
    progressButton.dataset.strideId = String(stride.id);
    progressButton.type = 'button';
    const progressIcon = document.createElement('span');
    progressIcon.setAttribute('aria-hidden', 'true');
    progressIcon.textContent = '\u{1F9DF}';
    progressButton.append(progressIcon, ' Progress');

    card.append(boardHeaderHtml(stride.name as string, isCollapsed, progressButton));

    const momentsDiv = document.createElement('div');
    momentsDiv.className = 'stride-moments' + (isCollapsed ? ' hidden' : '');

    if (moments.length === 0) {
        momentsDiv.append(renderEmptyStateSection({
            icon: 'bi-clock',
            title: 'No moments assigned.',
            description: 'Move moments from the backlog into this stride.',
        }));
    } else {
        const table = document.createElement('table');
        table.className = 'promisemodel-table';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const thText of ['Statement', 'Type', 'Status', 'Effort', 'Owner', 'Actions']) {
            const th = document.createElement('th');
            th.textContent = thText;
            headerRow.append(th);
        }
        thead.append(headerRow);
        table.append(thead);
        const tbody = document.createElement('tbody');
        for (const m of moments) {
            tbody.append(renderMomentRow(m, owner, project));
        }
        table.append(tbody);
        momentsDiv.append(table);
    }

    card.append(momentsDiv);
    strideBoard.append(card);
    populateSelectsWithin(card);
}

/**
 * Render a single moment table row for the backlog section.
 * @param {Record<string, unknown>} m - The moment object.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {HTMLElement} The table row element.
 */
function renderBacklogRow(
    m: Record<string, unknown>,
    owner: string,
    project: string,
): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.momentId = String(m.sequenceNumber);
    tr.dataset.flowId = String(m.flowId ?? '');

    const tdStatement = document.createElement('td');
    tdStatement.textContent = m.statement as string;
    tr.append(tdStatement);

    const tdType = document.createElement('td');
    tdType.append(momentTypeDropdownHtml(m.sequenceNumber as number | string, m.type as string));
    tr.append(tdType);

    const tdStatus = document.createElement('td');
    const sBadge = document.createElement('span');
    sBadge.className = 'status-badge status-' + ((m.status as string) || '').toLowerCase();
    sBadge.textContent = m.status as string;
    tdStatus.append(sBadge);
    tr.append(tdStatus);

    const tdEffort = document.createElement('td');
    tdEffort.textContent = (m.effortEstimate as string) ?? '\u{2013}';
    tr.append(tdEffort);

    const tdActions = document.createElement('td');
    const aDiv = document.createElement('div');
    aDiv.className = 'd-inline-flex flex-wrap gap-2 align-items-center';
    const targetSelect = document.createElement('select');
    targetSelect.className = 'backlog-target-stride form-select form-select-sm';
    targetSelect.dataset.momentId = String(m.sequenceNumber);
    aDiv.append(targetSelect);
    const moveButton = document.createElement('button');
    moveButton.className = 'move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm';
    moveButton.dataset.momentId = String(m.sequenceNumber);
    moveButton.type = 'button';
    moveButton.textContent = 'Move';
    aDiv.append(moveButton);
    const graphLink = momentGraphLinkHtml(m.sequenceNumber as number | string);
    if (graphLink) aDiv.append(graphLink);
    const vLink = document.createElement('a');
    vLink.href = '/' + owner + '/' + project + '/moments/' + (m.sequenceNumber as string);
    vLink.dataset.momentView = 'true';
    vLink.className = BTN_SM_CLASSES;
    vLink.textContent = 'View';
    aDiv.append(vLink);
    tdActions.append(aDiv);
    tr.append(tdActions);

    return tr;
}

/**
 * Render the backlog section (collapsible card with moments table or empty state).
 * @param {HTMLElement} backlogSection - The backlog section container element.
 * @param {unknown} backlogMoments - The backlog moments data.
 * @param {Record<string, unknown>[] | undefined} allStrides - The array of stride objects.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 */
function renderBacklogSection(
    backlogSection: HTMLElement,
    backlogMoments: unknown,
    allStrides: Record<string, unknown>[] | undefined,
    owner: string,
    project: string,
): void {
    const isBacklogCollapsed = !!(allStrides && allStrides.length > 0);
    backlogSection.replaceChildren();
    const backlogCard = document.createElement('div');
    backlogCard.className = 'stride-card backlog-board' + (isBacklogCollapsed ? ' is-collapsed' : '');
    backlogCard.dataset.collapsibleBoard = '1';
    backlogCard.append(boardHeaderHtml('Backlog', isBacklogCollapsed));
    const bContent = document.createElement('div');
    bContent.className = 'stride-moments backlog-content' + (isBacklogCollapsed ? ' hidden' : '');
    if (!backlogMoments || (backlogMoments as Record<string, unknown>[]).length === 0) {
        bContent.append(renderEmptyStateSection({
            icon: 'bi-inbox',
            title: 'No unassigned moments.',
            description: 'Create new moments or assign existing ones to this project.',
        }));
    } else {
        const table = document.createElement('table');
        table.className = 'promisemodel-table';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const thText of ['Statement', 'Type', 'Status', 'Effort', 'Actions']) {
            const th = document.createElement('th');
            th.textContent = thText;
            headerRow.append(th);
        }
        thead.append(headerRow);
        table.append(thead);
        const tbody = document.createElement('tbody');
        for (const m of (backlogMoments as Record<string, unknown>[])) {
            tbody.append(renderBacklogRow(m, owner, project));
        }
        table.append(tbody);
        bContent.append(table);
        populateSelectsWithin(backlogSection);
    }
    backlogCard.append(bContent);
    backlogSection.append(backlogCard);
}

/**
 * Load project members and populate all owner dropdowns.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function loadProjectMembers(owner: string, project: string): Promise<void> {
    try {
        const members = await getProjectMembers(owner, project);
        _state.cachedMembers = Array.isArray(members) ? members : [];
        for (const dropdown of document.querySelectorAll('.owner-dropdown')) {
            populateOwnerSelect(dropdown as HTMLSelectElement);
        }
    } catch (error) {
        console.error('Failed to load project members', error);
    }
}

/**
 * Fetch the current user's permission and apply the corresponding UI state.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<void>}
 */
async function checkUserPermission(owner: string, project: string): Promise<void> {
    try {
        const level = await getMyPermission(owner, project) as string | undefined;
        _state.isCachedCanEdit = (level && (level.toLowerCase() === 'edit' || level.toLowerCase() === 'owner')) as boolean;
        applyPermissionUI(_state.isCachedCanEdit);
    } catch (error) {
        console.error('Failed to get permission', error);
    }
}

/**
 * Populate all backlog-target-stride selects with the cached stride list.
 */
function populateBacklogStrideSelects(): void {
    for (const s of document.querySelectorAll('.backlog-target-stride')) {
        populateBacklogStrideSelect(s as HTMLSelectElement);
    }
}

/* ---------- Main export ---------- */
/**
 * Load and render the strides listing page for the latest iteration, including stride cards and backlog.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Record<string, unknown> } permission - The user's permission object.
 */
export async function loadStridesList(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: Record<string, unknown> | null): Promise<void> {
    const strideBoard = document.querySelector('#stride-board') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    if (!strideBoard || !errorElement) return;

    const backlogSection = document.querySelector('#backlog-section') as HTMLElement | null;
    const projectTitle = document.querySelector('#project-title') as HTMLElement | null;
    const strideButtonElement = document.querySelector('#create-stride-btn') as HTMLElement | null;
    const strideButtonLabelElement = document.querySelector('#create-stride-btn-label') as HTMLElement | null;

    _state.cachedOwner = owner;
    _state.cachedProject = project;
    strideBoard.replaceChildren(renderLoadingSpinner('Loading strides'));
    errorElement.textContent = '';
    if (backlogSection) backlogSection.replaceChildren();

    bindBoardCollapseToggles(strideBoard);
    if (backlogSection) bindBoardCollapseToggles(backlogSection);
    bindStrideStickyOffsetSync();

    const canEdit = permission?.permission === 'Edit';

    setUpCreateStrideButton(strideButtonElement, canEdit, owner, project, navContentDiv, contentDiv, permission);

    try {
        const projectData = await tryFetchProjectData(owner, project);
        const iterations = await getIterations(owner, project);

        _state.cachedIterations = Array.isArray(iterations) ? ([...iterations] as Record<string, unknown>[]).toSorted((a, b) => (b.id as number) - (a.id as number)) : [];

        if (_state.cachedIterations.length === 0) {
            handleEmptyIterations(strideBoard, projectTitle, strideButtonLabelElement, projectData, owner, project);
            return;
        }
        const latestIteration = _state.cachedIterations[0];

        updatePageHeader(latestIteration, projectData, projectTitle!, strideButtonLabelElement, owner, project, navContentDiv, contentDiv);

        const [strides, backlogMoments] = await Promise.all([
            getStridesByIteration(owner, project, latestIteration.id as number),
            getMomentsByIteration(owner, project, latestIteration.id as number, true)
        ]);

        strideBoard.replaceChildren();

        const allStrides = strides as Record<string, unknown>[];
        const results = await loadStrideData(owner, project, allStrides, strideBoard);

        // Render stride cards
        let cardIndex = 0;
        for (const { stride, moments } of results) {
            renderStrideCard(stride, moments as Record<string, unknown>[], cardIndex, owner, project, strideBoard);
            cardIndex++;
        }

        // Render Backlog
        if (backlogSection) {
            renderBacklogSection(backlogSection, backlogMoments, allStrides, owner, project);
        }

        requestAnimationFrame(syncStrideStickyOffsets);

        await loadProjectMembers(owner, project);
        await checkUserPermission(owner, project);

        // Update countdowns
        updateCountdowns();

        // Cache stride list for backlog move dropdowns (no refetch needed for later DOM inserts)
        const state = _state;
        state.cachedAllStrides = Array.isArray(allStrides) ? allStrides : [];
        renderStrideScrollspy(state.cachedAllStrides);
        // Ensure any backlog selects reflect the cached strides
        populateBacklogStrideSelects();

        // Attach planning event listeners (inline updates only; no full reload)
        attachPlanningListeners(owner, project, navContentDiv, contentDiv);
    } catch (error) {
        strideBoard?.replaceChildren();
        if (errorElement) errorElement.textContent = 'Failed to load data.';
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
    const strideBoard = document.querySelector('#stride-board') as HTMLElement;
    const backlogSection = document.querySelector('#backlog-section') as HTMLElement | null;

    bindInlineMomentControls(strideBoard, owner, project, navContentDiv, contentDiv);
    bindInlineMomentControls(backlogSection, owner, project, navContentDiv, contentDiv);
}

/**
 * Create a DOM option element.
 * @param {string} value - The option value.
 * @param {string} text - The option display text.
 * @param {boolean} isSelected - Whether the option is selected.
 * @returns {HTMLOptionElement} The option element.
 */
function createOption(value: string | null, text: string | null, isSelected: boolean): HTMLOptionElement {
    const opt = document.createElement('option');
    opt.value = (value ?? '');
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
    select.replaceChildren();
    select.append(createOption('', '–', current === ''));
    for (const k of estimateOrder) select.append(createOption(k, k, current === k));
}

/**
 * @param {HTMLSelectElement} select - Status select element
 */
function populateStatusSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const current = select.dataset.currentStatus || select.value || '';
    select.replaceChildren();
    for (const opt of STATUS_OPTIONS) {
        select.append(createOption(opt.value, `${opt.icon} ${opt.label}`, current === opt.value));
    }
}

/**
 * @param {HTMLSelectElement} select - Owner select element
 */
function populateOwnerSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const previous = select.value || select.dataset.ownerId || '';
    select.replaceChildren();
    select.append(createOption('', 'Unassigned', previous === ''));
    const cachedMembersList = _state.cachedMembers || [];
    for (const member of cachedMembersList) {
        select.append(createOption(String((member as Record<string, unknown>).userId), (member as Record<string, unknown>).userName as string, previous === String((member as Record<string, unknown>).userId)));
    }
    if ([...select.options].every(o => o.value !== previous)) {
        select.value = '';
    }
}

/**
 * @param {HTMLSelectElement} select - Backlog stride select element
 */
function populateBacklogStrideSelect(select: HTMLSelectElement): void {
    if (!select) return;
    const previous = select.value || '';
    select.replaceChildren();
    const allCachedStrides = _state.cachedAllStrides || [];
    for (const stride of allCachedStrides) {
        select.append(createOption(String((stride as Record<string, unknown>).id), (stride as Record<string, unknown>).name as string, previous === String((stride as Record<string, unknown>).id)));
    }
    if ([...select.options].every(o => o.value !== previous)) select.value = (select.options[0] && select.options[0].value) || '';
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
