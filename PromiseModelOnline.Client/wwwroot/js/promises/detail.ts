import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createEpic } from '../epics/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { getStatusHtml, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getPromise, getEpicsByPromise, updatePromiseDescription } from './api.ts';

/**
 * Disable promise detail controls when user lacks Edit permission.
 * @param {{ permission?: string } | null} permission - The user's permission object
 * @returns {void}
 */
function gatePromiseDetailControls(permission: { permission?: string } | null): void {
    const canEdit = permission?.permission === 'Edit';
    if (!canEdit) {
        const editButton = document.querySelector('#edit-desc-btn') as HTMLButtonElement | null;
        const saveButton_ = document.querySelector('#save-desc') as HTMLButtonElement | null;
        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement | null;
        if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
        if (saveButton_) { saveButton_.disabled = true; saveButton_.title = 'Requires Edit permission.'; }
        if (descInput) descInput.disabled = true;

        const epicInputElement = document.querySelector('#add-epic-statement') as HTMLInputElement | null;
        const epicSubmitElement = document.querySelector('#add-epic-submit') as HTMLButtonElement | null;
        if (epicInputElement) epicInputElement.disabled = true;
        if (epicSubmitElement) { epicSubmitElement.disabled = true; epicSubmitElement.title = 'Requires Edit permission.'; }
    }
}

/**
 * Set up the add-epic form submission handler.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} promiseId - The promise ID
 * @param {object} promise - The promise data object (mutated in place)
 * @param {Record<string, unknown>[]} epics - Current list of epics
 * @param {HTMLElement | null} tbody - The table body element for inline inserts
 * @returns {void}
 */
function setupEpicFormHandler(owner: string, project: string, promiseId: string, promise: any, epics: Record<string, unknown>[], tbody: HTMLElement | null): void {
    const form = document.querySelector('#add-epic-form') as HTMLFormElement | null;
    const statementInput = document.querySelector('#add-epic-statement') as HTMLInputElement | null;
    const message = document.querySelector('#add-epic-msg') as HTMLElement | null;
    const submitButton = document.querySelector('#add-epic-submit') as HTMLButtonElement | null;

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
                const created = await createEpic(owner, project, {
                    statement,
                    productPromiseId: promiseId,
                    displayOrder: (epics || []).length + 1,
                }) as Record<string, unknown> | null;

                if (created) {
                    removeInlineEmptyRow(tbody!);
                    const row = document.createElement('tr');
                    row.dataset.epicId = created.id as string;

                    const statementTd = document.createElement('td');
                    statementTd.textContent = created.statement as string;

                    const actionsTd = document.createElement('td');
                    const viewLink = document.createElement('a');
                    viewLink.href = '/' + owner + '/' + project + '/epics/' + created.sequenceNumber;
                    viewLink.dataset.epicSeq = created.sequenceNumber as string;
                    viewLink.className = 'btn btn-sm btn-outline-primary';
                    viewLink.textContent = 'View';
                    actionsTd.append(viewLink);

                    row.append(statementTd, actionsTd);
                    insertRowBeforeAddRow(tbody!, row);
                    statementInput.value = '';
                    patchChildMetrics('promise-' + promise.sequenceNumber, [...(epics || []), created as Record<string, unknown>]);
                }
            } catch (error) {
                message.textContent = 'Failed to add epic.';
                console.error(error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }
}

/**
 * Bind click handlers for epic links to enable client-side routing.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @param {HTMLElement | null} detailDiv - The detail container element
 * @returns {void}
 */
function bindEpicClickHandlers(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, detailDiv: HTMLElement | null): void {
    for (const link of detailDiv!.querySelectorAll('a[epic-id]')) {
        link.addEventListener('click', (event) => {
            if ((event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).button === 1) return;

            event.preventDefault();

            void navigate(`/${owner}/${project}/epics/${link.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
        });
    }
}

/**
 * Set up the description inline-edit save handler for a promise.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} promiseId - The promise ID
 * @param {object} promise - The promise data object (mutated in place)
 * @returns {void}
 */
function setupDescriptionHandler(owner: string, project: string, promiseId: string, promise: any): void {
    const descMessage = document.querySelector('#desc-save-msg') as HTMLElement | null;
    const saveButton = document.querySelector('#save-desc') as HTMLButtonElement | null;
    if (saveButton) {
        saveButton.addEventListener('click', async (event) => {
            event.preventDefault();
            if (descMessage) descMessage.textContent = '';
            saveButton.disabled = true;
            const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
            try {
                const updated = await updatePromiseDescription(owner, project, promiseId, newDesc);
                promise.description = (updated as Record<string, unknown>)?.description ?? (newDesc.trim() ? newDesc : undefined);
                patchDetailStackGraphNode(`promise-${promise.sequenceNumber}`, {
                    description: promise.description,
                });
                const editor = (promise as any).__editor as { showSavedPopover?: (html: string) => void } | undefined;
                if (editor && editor.showSavedPopover) editor.showSavedPopover(formatCommentText(promise.description || ''));
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
 * Load and render the epics list for a promise.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} promiseId - The promise ID
 * @param {object} promise - The promise data object
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadPromiseEpics(owner: string, project: string, promiseId: string, promise: any, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const epicsList = document.querySelector('#promise-epics-list') as HTMLElement | null;
    const detailDiv = document.querySelector('#promise-detail-content') as HTMLElement | null;

    try {
        const epics = await getEpicsByPromise(owner, project, promiseId) as Record<string, unknown>[];
        patchChildMetrics('promise-' + promise.sequenceNumber, epics);
        const tbody = renderTableWithInlineAddRow(epicsList!, {
            headers: ['Statement', 'Actions'],
            items: epics || [],
            emptyMessage: 'No epics found for this promise.',
            renderItemRow: (epic: unknown) => {
                const epicItem = epic as Record<string, unknown>;
                return '<tr data-epic-id="' + (epicItem.id as string) + '">'
                    + '<td>' + escapeHtml(epicItem.statement as string) + '</td>'
                    + '<td><a href="/' + owner + '/' + project + '/epics/' + (epicItem.sequenceNumber as string) + '" epic-seq="' + (epicItem.sequenceNumber as string) + '" class="btn btn-sm btn-outline-primary">View</a></td>'
                    + '</tr>';
            },
            renderAddRow: () => ''
                + '<tr data-inline-add-row="1">'
                + '<td>'
                + '<form id="add-epic-form" class="inline-add-form">'
                + '<input id="add-epic-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Epic Statement..." aria-label="New epic statement">'
                + '</form>'
                + '</td>'
                + '<td>'
                + '<button id="add-epic-submit" type="submit" form="add-epic-form" class="btn btn-sm btn-outline-primary">Add</button>'
                + '<span id="add-epic-msg"></span>'
                + '</td>'
                + '</tr>',
        }) as HTMLTableSectionElement | null;

        setupEpicFormHandler(owner, project, promiseId, promise, epics || [], tbody);

        epicsList!.replaceChildren();
        const epicsTable = document.createElement('table');
        epicsTable.className = 'table table-sm table-striped align-middle promisemodel-table';

        const epicsThead = document.createElement('thead');
        const epicsHeaderRow = document.createElement('tr');
        const statementTh = document.createElement('th');
        statementTh.scope = 'col';
        statementTh.textContent = 'Statement';
        const actionsTh = document.createElement('th');
        actionsTh.scope = 'col';
        actionsTh.textContent = 'Actions';
        epicsHeaderRow.append(statementTh, actionsTh);
        epicsThead.append(epicsHeaderRow);
        epicsTable.append(epicsThead);

        const epicsTbody = document.createElement('tbody');
        for (const epic of epics as Array<{ id: string; sequenceNumber: string; statement: string }>) {
            const epicTr = document.createElement('tr');
            const epicStmtTd = document.createElement('td');
            epicStmtTd.textContent = epic.statement;
            const epicActionsTd = document.createElement('td');
            const epicViewLink = document.createElement('a');
            epicViewLink.href = '/' + owner + '/' + project + '/epics/' + epic.sequenceNumber;
            epicViewLink.dataset.epicId = epic.id;
            epicViewLink.dataset.epicSeq = epic.sequenceNumber;
            epicViewLink.className = 'btn btn-sm btn-outline-primary';
            epicViewLink.textContent = 'View';
            epicActionsTd.append(epicViewLink);
            epicTr.append(epicStmtTd, epicActionsTd);
            epicsTbody.append(epicTr);
        }
        epicsTable.append(epicsTbody);
        epicsList!.append(epicsTable);

        bindEpicClickHandlers(owner, project, navContentDiv, contentDiv, detailDiv);
    } catch {
        if (epicsList) {
            epicsList.replaceChildren();
            const errorP = document.createElement('p');
            errorP.className = 'error';
            errorP.textContent = 'Failed to load epics.';
            epicsList.append(errorP);
        }
    }
}

/**
 * Insert or update the graph view button for a promise.
 * @param {HTMLElement | null} detailDiv - The detail container element
 * @param {object} promise - The promise data
 * @returns {void}
 */
function upsertPromiseGraphViewButton(detailDiv: HTMLElement | null, promise: any): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (go && gp) {
        const href = buildGraphViewHref(go, gp, 'promise-' + promise.sequenceNumber);
        if (href) upsertGraphViewButton(detailDiv, href);
    }
}

/**
 * Load and render the promise detail page with epics, graph, comments, and reactions.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} promiseId - The promise ID
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @param {{ permission?: string } | null} permission - The user's permission object
 * @returns {Promise<void>}
 */
export async function loadPromiseDetail(owner: string, project: string, promiseId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission?: string } | null): Promise<void> {
    const detailDiv = document.querySelector('#promise-detail-content') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#promise-detail-loading') as HTMLElement | null;

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    errorElement!.textContent = '';

    try {
        const promise = await getPromise(owner, project, promiseId) as any;
        await loadEntityLookupMap('Promise', promise.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        detailDiv!.replaceChildren();

        const cardDiv = document.createElement('div');
        cardDiv.className = 'detail-card promise-detail-card';

        const cardH2 = document.createElement('h2');
        cardH2.textContent = promise.statement;
        cardDiv.append(cardH2);

        const detailTable = document.createElement('table');
        detailTable.className = 'table table-sm table-striped align-middle detail-table';

        const editWrapper = document.createElement('div');
        editWrapper.className = 'inline-edit-wrapper';

        const descP = document.createElement('p');
        descP.id = 'description-view';
        descP.className = 'inline-edit-view';
        const descParser = new DOMParser();
        const descDocument = descParser.parseFromString(formatCommentText(promise.description || ''), 'text/html');
        descP.append(...descDocument.body.childNodes);
        editWrapper.append(descP);

        const editButton_ = document.createElement('button');
        editButton_.id = 'edit-desc-btn';
        editButton_.className = 'btn btn-success btn-sm inline-edit-btn';
        editButton_.type = 'button';
        editButton_.title = 'Edit description';
        const editIcon = document.createElement('i');
        editIcon.className = 'bi bi-pencil';
        editButton_.append(editIcon);
        editWrapper.append(editButton_);

        const descTextarea = document.createElement('textarea');
        descTextarea.id = 'description-input';
        descTextarea.rows = 4;
        descTextarea.className = 'form-control detail-textarea';
        descTextarea.setAttribute('aria-label', 'Description');
        descTextarea.style.display = 'none';
        descTextarea.value = promise.description || '';
        editWrapper.append(descTextarea);

        const fieldActions = document.createElement('div');
        fieldActions.className = 'field-actions';
        const cancelButton_ = document.createElement('button');
        cancelButton_.id = 'cancel-desc';
        cancelButton_.className = 'btn btn-outline-secondary btn-sm';
        cancelButton_.type = 'button';
        cancelButton_.style.display = 'none';
        cancelButton_.textContent = 'Cancel';
        const saveButton_ = document.createElement('button');
        saveButton_.id = 'save-desc';
        saveButton_.className = 'btn btn-primary btn-sm';
        saveButton_.type = 'button';
        saveButton_.textContent = 'Save';
        const saveMessageSpan = document.createElement('span');
        saveMessageSpan.id = 'desc-save-msg';
        fieldActions.append(cancelButton_, saveButton_, saveMessageSpan);

        const descTd = document.createElement('div');
        descTd.append(editWrapper, fieldActions);

        const descTr = document.createElement('tr');
        const descTh = document.createElement('th');
        descTh.scope = 'row';
        const descLabel = document.createElement('label');
        descLabel.htmlFor = 'description-input';
        descLabel.textContent = 'Description';
        descTh.append(descLabel);
        const descTdCell = document.createElement('td');
        descTdCell.append(descTd);
        descTr.append(descTh, descTdCell);
        detailTable.append(descTr);

        const statusTr = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        statusTh.textContent = 'Status';
        const statusTd = document.createElement('td');
        const statusParser = new DOMParser();
        const statusDocument = statusParser.parseFromString(getStatusHtml(promise.statusColor), 'text/html');
        statusTd.append(...statusDocument.body.childNodes);
        statusTr.append(statusTh, statusTd);
        detailTable.append(statusTr);

        const createdTr = document.createElement('tr');
        const createdTh = document.createElement('th');
        createdTh.scope = 'row';
        createdTh.textContent = 'Created';
        const createdTd = document.createElement('td');
        createdTd.textContent = new Date(promise.createdAt).toLocaleDateString('en-CA');
        createdTr.append(createdTh, createdTd);
        detailTable.append(createdTr);

        const updatedTr = document.createElement('tr');
        const updatedTh = document.createElement('th');
        updatedTh.scope = 'row';
        updatedTh.textContent = 'Updated';
        const updatedTd = document.createElement('td');
        updatedTd.textContent = promise.updatedAt ? new Date(promise.updatedAt).toLocaleDateString('en-CA') : '\u{2013}';
        updatedTr.append(updatedTh, updatedTd);
        detailTable.append(updatedTr);

        cardDiv.append(detailTable);

        const epicsH3 = document.createElement('h3');
        epicsH3.textContent = 'Epics';
        cardDiv.append(epicsH3);

        const epicsListDiv = document.createElement('div');
        epicsListDiv.id = 'promise-epics-list';
        const loadingP = document.createElement('p');
        loadingP.textContent = 'Loading epics\u{2026}';
        epicsListDiv.append(loadingP);
        cardDiv.append(epicsListDiv);

        const commentsDiv = document.createElement('div');
        commentsDiv.id = 'promise-comments';
        cardDiv.append(commentsDiv);

        const backButton = document.createElement('button');
        backButton.id = 'back-link';
        backButton.className = 'btn btn-outline-secondary btn-sm';
        backButton.type = 'button';
        const backSpan = document.createElement('span');
        backSpan.setAttribute('aria-hidden', 'true');
        backSpan.textContent = '\u{2190}';
        backButton.append(backSpan, ' Back');
        cardDiv.append(backButton);

        detailDiv!.append(cardDiv);

        if (loadingElement) loadingElement.hidden = true;

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement | null;
        const descView = document.querySelector('#description-view') as HTMLElement | null;
        const editButton = document.querySelector('#edit-desc-btn') as HTMLButtonElement | null;
        const saveButton = document.querySelector('#save-desc') as HTMLButtonElement | null;
        const cancelButton = document.querySelector('#cancel-desc') as HTMLButtonElement | null;
        if (descInput && descView && editButton) {
            createCommentAutocomplete(descInput, 'Promise', promise.id);
            const editor = setupInlineEdit(descInput, descView, editButton, saveButton!, cancelButton!);
            (promise as any).__editor = editor;
        }

        void mountDetailStackGraph({
            nodeType: 'promise',
            nodeId: promiseId,
            owner,
            project,
        });
        await loadPromiseEpics(owner, project, promiseId, promise, navContentDiv, contentDiv);


        gatePromiseDetailControls(permission);

        loadCommentsAndReactions(detailDiv!, 'Promise', promise.id, owner, project, permission!);

        upsertPromiseGraphViewButton(detailDiv, promise);


        initBackLink();

        setupDescriptionHandler(owner, project, promiseId, promise);

        if (loadingElement) loadingElement.hidden = true;
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load promise details.';
        console.error(error);
    }
}
