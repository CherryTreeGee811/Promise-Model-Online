import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createJourney } from '../journeys/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { getPromiseById } from '../promises/api.ts';
import { navigate } from '../router.ts';
import { getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml, htmlToNodes } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getEpic, getJourneys, updateEpicDescription } from './api.ts';

interface Epic {
    id: number;
    sequenceNumber: number;
    statement: string;
    description?: string;
    statusColor?: string;
    createdAt: string;
    updatedAt?: string;
    productPromiseId: number;
}

interface JourneyItem {
    id: number;
    sequenceNumber: number;
    statement: string;
}

interface PromiseItem {
    id: number;
    sequenceNumber: number;
    statement: string;
    statusColor?: string;
}

/**
 * Disable epic detail controls when user lacks Edit permission.
 * @param {{ permission: string } | undefined} permission - The user's permission object
 * @returns {void}
 */
function gateEpicDetailControls(permission: { permission: string } | undefined): void {
    const canEdit = permission?.permission === 'Edit';
    if (!canEdit) {
        const editButton__ = document.querySelector('#edit-desc-btn') as HTMLButtonElement;
        const saveButton__ = document.querySelector('#save-desc') as HTMLButtonElement;
        const descInp = document.querySelector('#description-input') as HTMLInputElement;
        if (editButton__) { editButton__.disabled = true; editButton__.title = 'Requires Edit permission.'; }
        if (saveButton__) { saveButton__.disabled = true; saveButton__.title = 'Requires Edit permission.'; }
        if (descInp) descInp.disabled = true;

        const journeyStatementInput = document.querySelector('#add-journey-statement') as HTMLInputElement;
        const journeySubmitButton = document.querySelector('#add-journey-submit') as HTMLButtonElement;
        if (journeyStatementInput) journeyStatementInput.disabled = true;
        if (journeySubmitButton) { journeySubmitButton.disabled = true; journeySubmitButton.title = 'Requires Edit permission.'; }
    }
}

/**
 * Set up the description inline-edit save handler for an epic.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} epicId - The epic ID
 * @param {Epic} epic - The epic data object (mutated in place)
 * @returns {void}
 */
function setupDescriptionHandler(owner: string, project: string, epicId: string, epic: any): void {
    const descMessage = document.querySelector('#desc-save-msg') as HTMLElement;
    const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
    if (saveButton) {
        saveButton.addEventListener('click', async (event) => {
            event.preventDefault();
            if (descMessage) descMessage.textContent = '';
            saveButton.disabled = true;
            const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
            try {
                const updated = await updateEpicDescription(owner, project, epicId, newDesc) as { description?: string } | undefined;
                epic.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                patchDetailStackGraphNode('epic-' + epic.sequenceNumber, {
                    description: epic.description,
                });
                const editor = (epic as any).__editor as { showSavedPopover?: (html: string) => void } | undefined;
                if (editor?.showSavedPopover) editor.showSavedPopover(formatCommentText(epic.description || ''));
            } catch (error) {
                if (descMessage) descMessage.textContent = 'Save failed';
                console.error(error);
            } finally {
                saveButton.disabled = false;
            }
        });
    }
}

/**
 * Bind click handlers for journey links to enable client-side routing.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @param {HTMLElement} journeysList - Container element holding journey links
 * @returns {void}
 */
function bindJourneyClickHandlers(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, journeysList: HTMLElement): void {
    for (const link of journeysList.querySelectorAll('a[journey-id]')) {
        link.addEventListener('click', (event) => {
            const me = event as MouseEvent;
            if (me.ctrlKey || me.metaKey || me.button === 1) return;
            event.preventDefault();
            void navigate(link.getAttribute('journey-seq')!, navContentDiv, contentDiv);
        });
    }
}

/**
 * Load and render the parent promise link for an epic.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {Epic} epic - The epic whose parent promise to load
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadParentPromise(owner: string, project: string, epic: Epic, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const parentCell = document.querySelector('#epic-parent-promise') as HTMLElement;
    try {
        const promise = await getPromiseById(owner, project, epic.productPromiseId) as PromiseItem;
        const icon = getStatusIcon(promise.statusColor ?? '');
        const label = getStatusLabel(promise.statusColor ?? '');
        if (parentCell) parentCell.replaceChildren();
        const link = document.createElement('a');
        link.href = '/' + owner + '/' + project + '/promises/' + promise.sequenceNumber;
        link.className = 'detail-link link-primary text-decoration-none fw-semibold';
        link.textContent = promise.statement;
        if (parentCell) parentCell.append(link);
        const statusSpan = document.createElement('span');
        statusSpan.setAttribute('aria-hidden', 'true');
        statusSpan.textContent = icon;
        if (parentCell) parentCell.append(statusSpan);
        const srSpan = document.createElement('span');
        srSpan.className = 'sr-only';
        srSpan.textContent = label;
        if (parentCell) parentCell.append(srSpan);

        if (link) {
            link.addEventListener('click', (event) => {
                const me = event as MouseEvent;
                if (me.ctrlKey || me.metaKey || me.button === 1) return;
                event.preventDefault();
                void navigate(link.getAttribute('href')!, navContentDiv, contentDiv);
            });
        }
    } catch {
        if (parentCell) parentCell.textContent = 'Promise ' + epic.productPromiseId;
    }
}

/**
 * Set up the add-journey form submission handler.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} epicId - The epic ID
 * @param {Epic} epic - The epic data object (mutated in place)
 * @param {JourneyItem[]} journeys - Current list of journeys
 * @param {HTMLElement | null} tbody - The table body element for inline inserts
 * @returns {void}
 */
function setupJourneyFormHandler(owner: string, project: string, epicId: string, epic: any, journeys: JourneyItem[], tbody: HTMLElement | null): void {
    const form = document.querySelector('#add-journey-form') as HTMLFormElement;
    const statementInput = document.querySelector('#add-journey-statement') as HTMLInputElement;
    const message = document.querySelector('#add-journey-msg') as HTMLElement;
    const submitButton = document.querySelector('#add-journey-submit') as HTMLButtonElement;

    if (form && statementInput && message && submitButton) {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            message.textContent = '';

            const statement = statementInput.value.trim();
            if (!statement) {
                message.textContent = 'Statement is required.';
                return;
            }

            submitButton.disabled = true;

            try {
                const created = await createJourney(owner, project, {
                    statement,
                    epicId,
                    displayOrder: (journeys || []).length + 1,
                }) as JourneyItem;

                if (created) {
                    removeInlineEmptyRow(tbody!);
                    const row = document.createElement('tr');
                    row.dataset.journeyId = String(created.id);

                    const tdStmt = document.createElement('td');
                    tdStmt.textContent = created.statement;
                    row.append(tdStmt);

                    const tdActions = document.createElement('td');
                    const viewLink = document.createElement('a');
                    viewLink.href = '/' + owner + '/' + project + '/journeys/' + created.sequenceNumber;
                    viewLink.setAttribute('journey-id', String(created.id));
                    viewLink.setAttribute('journey-seq', String(created.sequenceNumber));
                    viewLink.className = 'btn btn-sm btn-outline-primary';
                    viewLink.textContent = 'View';
                    tdActions.append(viewLink);
                    row.append(tdActions);

                    insertRowBeforeAddRow(tbody!, row);
                    statementInput.value = '';
                    patchChildMetrics('epic-' + epic.sequenceNumber, [...(journeys || []), created] as unknown as Record<string, unknown>[]);
                }
            } catch (error) {
                message.textContent = 'Failed to add journey.';
                console.error(error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }
}

/**
 * Load and render the journeys list for an epic.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} epicId - The epic ID
 * @param {Epic} epic - The epic data object
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadEpicJourneys(owner: string, project: string, epicId: string, epic: any, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const journeysList = document.querySelector('#epic-journeys-list') as HTMLElement;

    try {
        const journeys = await getJourneys(owner, project, epicId) as JourneyItem[];
        patchChildMetrics('epic-' + epic.sequenceNumber, journeys as unknown as Record<string, unknown>[]);
        const tbody = renderTableWithInlineAddRow(journeysList, {
            headers: ['Statement', 'Actions'],
            items: journeys || [],
            emptyMessage: 'No journeys found for this epic.',
            renderItemRow: (item: unknown) => {
                const index = item as JourneyItem;
                return '<tr data-journey-id="' + index.id + '">'
                    + '<td>' + escapeHtml(index.statement) + '</td>'
                    + '<td><a href="/' + owner + '/' + project + '/journeys/' + index.sequenceNumber + '" journey-id="' + index.id + '" journey-seq="' + index.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td>'
                    + '</tr>';
            },
            renderAddRow: () => ''
                + '<tr data-inline-add-row="1">'
                + '<td>'
                + '<form id="add-journey-form" class="inline-add-form">'
                + '<input id="add-journey-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Journey Statement..." aria-label="New journey statement">'
                + '</form>'
                + '</td>'
                + '<td>'
                + '<button id="add-journey-submit" type="submit" form="add-journey-form" class="btn btn-sm btn-outline-primary">Add</button>'
                + '<span id="add-journey-msg"></span>'
                + '</td>'
                + '</tr>',
        });

        setupJourneyFormHandler(owner, project, epicId, epic, journeys || [], tbody);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-responsive';
        const journeyTable = document.createElement('table');
        journeyTable.className = 'table table-sm table-striped align-middle promisemodel-table';

        const indexThead = document.createElement('thead');
        const indexHeaderRow = document.createElement('tr');
        const indexHeaders = ['Statement', 'Actions'];
        for (const h of indexHeaders) {
            const th = document.createElement('th');
            th.textContent = h;
            indexHeaderRow.append(th);
        }
        indexThead.append(indexHeaderRow);
        journeyTable.append(indexThead);

        const indexTbody = document.createElement('tbody');
        for (const index of journeys) {
            const tr = document.createElement('tr');
            const tdStmt = document.createElement('td');
            tdStmt.textContent = index.statement;
            tr.append(tdStmt);

            const tdActions = document.createElement('td');
            const viewLink = document.createElement('a');
            viewLink.href = '/' + owner + '/' + project + '/journeys/' + index.sequenceNumber;
            viewLink.setAttribute('journey-id', String(index.id));
            viewLink.setAttribute('journey-seq', String(index.sequenceNumber));
            viewLink.className = 'btn btn-sm btn-outline-primary';
            viewLink.textContent = 'View';
            tdActions.append(viewLink);
            tr.append(tdActions);

            indexTbody.append(tr);
        }
        journeyTable.append(indexTbody);
        tableWrapper.append(journeyTable);
        journeysList.replaceChildren(tableWrapper);

        bindJourneyClickHandlers(owner, project, navContentDiv, contentDiv, journeysList);
    } catch {
        journeysList.replaceChildren();
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Failed to load journeys.';
        journeysList.append(p);
    }
}

/**
 * Insert or update the graph view button for an epic.
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {Epic} epic - The epic data
 * @returns {void}
 */
function upsertEpicGraphViewButton(detailDiv: HTMLElement, epic: Epic): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (go && gp) {
        const href = buildGraphViewHref(go, gp, 'epic-' + epic.sequenceNumber);
        if (href) upsertGraphViewButton(detailDiv, href);
    }
}

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} epicId - The epic ID
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {{ permission: string } | undefined} permission - Permission object
 */
export async function loadEpicDetail(owner: string, project: string, epicId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission: string } | undefined): Promise<void> {
    const detailDiv = document.querySelector('#epic-detail-content') as HTMLElement;
    const errorElement = document.querySelector('#error-text') as HTMLElement;
    const loadingElement = document.querySelector('#epic-detail-loading') as HTMLElement;

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    if (errorElement) errorElement.textContent = '';

    try {
        const epic = await getEpic(owner, project, epicId) as Epic;
        await loadEntityLookupMap('Epic', epic.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'epic',
            nodeId: epicId,
            owner,
            project,
        });

        const detailCard = document.createElement('div');
        detailCard.className = 'detail-card epic-detail-card';

        const heading = document.createElement('h2');
        heading.textContent = epic.statement;
        detailCard.append(heading);

        const table = document.createElement('table');
        table.className = 'table table-sm table-striped align-middle detail-table';

        const descRow = document.createElement('tr');
        const descTh = document.createElement('th');
        descTh.scope = 'row';
        const descLabel = document.createElement('label');
        descLabel.htmlFor = 'description-input';
        descLabel.textContent = 'Description';
        descTh.append(descLabel);
        descRow.append(descTh);
        const descTd = document.createElement('td');
        const inlineEditWrapper = document.createElement('div');
        inlineEditWrapper.className = 'inline-edit-wrapper';
        const descView = document.createElement('p');
        descView.id = 'description-view';
        descView.className = 'inline-edit-view';
        descView.append(...htmlToNodes(formatCommentText(epic.description || '')));
        inlineEditWrapper.append(descView);
        const editButton_ = document.createElement('button');
        editButton_.id = 'edit-desc-btn';
        editButton_.className = 'btn btn-success btn-sm inline-edit-btn';
        editButton_.type = 'button';
        editButton_.title = 'Edit description';
        const pencilIcon = document.createElement('i');
        pencilIcon.className = 'bi bi-pencil';
        editButton_.append(pencilIcon);
        inlineEditWrapper.append(editButton_);
        const descTextarea = document.createElement('textarea');
        descTextarea.id = 'description-input';
        descTextarea.rows = 4;
        descTextarea.className = 'form-control detail-textarea';
        descTextarea.setAttribute('aria-label', 'Description');
        descTextarea.style.display = 'none';
        descTextarea.textContent = epic.description || '';
        inlineEditWrapper.append(descTextarea);
        descTd.append(inlineEditWrapper);
        const fieldActions = document.createElement('div');
        fieldActions.className = 'field-actions';
        const cancelButton_ = document.createElement('button');
        cancelButton_.id = 'cancel-desc';
        cancelButton_.className = 'btn btn-outline-secondary btn-sm';
        cancelButton_.type = 'button';
        cancelButton_.style.display = 'none';
        cancelButton_.textContent = 'Cancel';
        fieldActions.append(cancelButton_);
        const saveButton_ = document.createElement('button');
        saveButton_.id = 'save-desc';
        saveButton_.className = 'btn btn-primary btn-sm';
        saveButton_.type = 'button';
        saveButton_.textContent = 'Save';
        fieldActions.append(saveButton_);
        const saveMessage = document.createElement('span');
        saveMessage.id = 'desc-save-msg';
        fieldActions.append(saveMessage);
        descTd.append(fieldActions);
        descRow.append(descTd);
        table.append(descRow);

        const parentRow = document.createElement('tr');
        const parentTh = document.createElement('th');
        parentTh.textContent = 'Parent Promise';
        parentRow.append(parentTh);
        const parentTd = document.createElement('td');
        parentTd.id = 'epic-parent-promise';
        parentTd.textContent = 'Loading\u{2026}';
        parentRow.append(parentTd);
        table.append(parentRow);

        const statusRow = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        statusTh.textContent = 'Status';
        statusRow.append(statusTh);
        const statusTd = document.createElement('td');
        const statusIconSpan = document.createElement('span');
        statusIconSpan.setAttribute('aria-hidden', 'true');
        statusIconSpan.textContent = getStatusIcon(epic.statusColor ?? '');
        statusTd.append(statusIconSpan);
        const statusSrSpan = document.createElement('span');
        statusSrSpan.className = 'sr-only';
        statusSrSpan.textContent = getStatusLabel(epic.statusColor ?? '');
        statusTd.append(statusSrSpan);
        statusRow.append(statusTd);
        table.append(statusRow);

        const createdRow = document.createElement('tr');
        const createdTh = document.createElement('th');
        createdTh.scope = 'row';
        createdTh.textContent = 'Created';
        createdRow.append(createdTh);
        const createdTd = document.createElement('td');
        createdTd.textContent = new Date(epic.createdAt).toLocaleDateString('en-CA');
        createdRow.append(createdTd);
        table.append(createdRow);

        const updatedRow = document.createElement('tr');
        const updatedTh = document.createElement('th');
        updatedTh.scope = 'row';
        updatedTh.textContent = 'Updated';
        updatedRow.append(updatedTh);
        const updatedTd = document.createElement('td');
        updatedTd.textContent = epic.updatedAt ? new Date(epic.updatedAt).toLocaleDateString('en-CA') : '\u{2013}';
        updatedRow.append(updatedTd);
        table.append(updatedRow);

        detailCard.append(table);

        const journeysHeading = document.createElement('h3');
        journeysHeading.textContent = 'Journeys';
        detailCard.append(journeysHeading);

        const journeysList = document.createElement('div');
        journeysList.id = 'epic-journeys-list';
        const loadingP = document.createElement('p');
        loadingP.textContent = 'Loading journeys\u{2026}';
        journeysList.append(loadingP);
        detailCard.append(journeysList);

        const commentsDiv = document.createElement('div');
        commentsDiv.id = 'epic-comments';
        detailCard.append(commentsDiv);

        const backButton = document.createElement('button');
        backButton.id = 'back-link';
        backButton.className = 'btn btn-outline-secondary btn-sm';
        backButton.type = 'button';
        const backSpan = document.createElement('span');
        backSpan.setAttribute('aria-hidden', 'true');
        backSpan.textContent = '\u{2190}';
        backButton.append(backSpan, ' Back');
        detailCard.append(backButton);

        if (detailDiv) detailDiv.replaceChildren(detailCard);

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement;
        const descViewElement = document.querySelector('#description-view') as HTMLElement;
        const editButton = document.querySelector('#edit-desc-btn') as HTMLElement;
        const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
        const cancelButton = document.querySelector('#cancel-desc') as HTMLElement;
        if (descInput && descViewElement && editButton) {
            createCommentAutocomplete(descInput, 'Epic', epic.id);
            const editor = setupInlineEdit(descInput, descViewElement, editButton, saveButton, cancelButton);
            (epic as any).__editor = editor;
        }

        await loadParentPromise(owner, project, epic, navContentDiv, contentDiv);

        await loadEpicJourneys(owner, project, epicId, epic, navContentDiv, contentDiv);

        initBackLink();
        gateEpicDetailControls(permission);

        loadCommentsAndReactions(detailDiv, 'Epic', epic.id, owner, project, permission);

        setupDescriptionHandler(owner, project, epicId, epic);

        upsertEpicGraphViewButton(detailDiv, epic);
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load epic details.';
        console.error(error);
    }
}
