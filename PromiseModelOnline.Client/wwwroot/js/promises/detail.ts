import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createEpic } from '../epics/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { gateDetailControls, getStatusHtml, bindLinkClickHandlers, setupDescriptionHandler, buildInlineEditUI, createDateRow, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupAddChildForm } from '../utils/inline-add-form.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow } from '../utils/inline-table.ts';

import { getPromise, getEpicsByPromise, updatePromiseDescription } from './api.ts';

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
async function loadPromiseEpics(owner: string, project: string, promiseId: string, promise: Record<string, unknown>, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
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
            renderAddRow: () => '<tr data-inline-add-row="1">'
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

        setupAddChildForm({
            formId: 'add-epic-form',
            inputId: 'add-epic-statement',
            submitButtonId: 'add-epic-submit',
            msgId: 'add-epic-msg',
            owner,
            project,
            tbody,
            onCreate: async (statement) => createEpic(owner, project, {
                statement,
                productPromiseId: promiseId,
                displayOrder: (epics || []).length + 1,
            }) as Promise<Record<string, unknown> | null>,
            getRowHtml: (created) => '<tr><td>' + escapeHtml(created.statement as string) + '</td>'
                + '<td><a href="/' + owner + '/' + project + '/epics/' + created.sequenceNumber + '" data-epic-seq="' + created.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td></tr>',
            datasetKey: 'epic-id',
            childMetricsKey: 'promise-' + promise.sequenceNumber,
            items: epics as Record<string, unknown>[],
        });

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
            epicTr.dataset.epicSeq = String(epic.sequenceNumber);
            const epicStatementTd = document.createElement('td');
            epicStatementTd.textContent = epic.statement;
            const epicActionsTd = document.createElement('td');
            const epicViewLink = document.createElement('a');
            epicViewLink.href = '/' + owner + '/' + project + '/epics/' + epic.sequenceNumber;
            epicViewLink.dataset.epicId = epic.id;
            epicViewLink.dataset.epicSeq = epic.sequenceNumber;
            epicViewLink.className = 'btn btn-sm btn-outline-primary';
            epicViewLink.textContent = 'View';
            epicActionsTd.append(epicViewLink);
            epicTr.append(epicStatementTd, epicActionsTd);
            epicsTbody.append(epicTr);
        }
        epicsTable.append(epicsTbody);
        epicsList!.append(epicsTable);

        bindLinkClickHandlers(detailDiv!, 'a[epic-id]', 'epic-seq', 'epics', owner, project, navContentDiv, contentDiv);
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
function upsertPromiseGraphViewButton(detailDiv: HTMLElement | null, promise: Record<string, unknown>): void {
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
        const promise = await getPromise(owner, project, promiseId) as Record<string, unknown>;
        await loadEntityLookupMap('Promise', promise.id as number, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        detailDiv!.replaceChildren();

        const cardDiv = document.createElement('div');
        cardDiv.className = 'detail-card promise-detail-card';

        const cardH2 = document.createElement('h2');
        cardH2.textContent = promise.statement as string | null;
        cardDiv.append(cardH2);

        const detailTable = document.createElement('table');
        detailTable.className = 'table table-sm table-striped align-middle detail-table';

        const descTr = document.createElement('tr');
        const descTh = document.createElement('th');
        descTh.scope = 'row';
        const descLabel = document.createElement('label');
        descLabel.htmlFor = 'description-input';
        descLabel.textContent = 'Description';
        descTh.append(descLabel);
        const descTd = document.createElement('td');
        buildInlineEditUI(descTd, '', (promise.description as string) || '');
        descTr.append(descTh, descTd);
        detailTable.append(descTr);

        const statusTr = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        statusTh.textContent = 'Status';
        const statusTd = document.createElement('td');
        const statusParser = new DOMParser();
        const statusDocument = statusParser.parseFromString(getStatusHtml(promise.statusColor as string), 'text/html');
        statusTd.append(...statusDocument.body.childNodes);
        statusTr.append(statusTh, statusTd);
        detailTable.append(statusTr);

        detailTable.append(createDateRow('Created', promise.createdAt as string | undefined));
        detailTable.append(createDateRow('Updated', promise.updatedAt as string | undefined));

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
            createCommentAutocomplete(descInput, 'Promise', promise.id as number);
            const editor = setupInlineEdit(descInput, descView, editButton, saveButton!, cancelButton!);
            (promise as Record<string, unknown>).__editor = editor;
        }

        void mountDetailStackGraph({
            nodeType: 'promise',
            nodeId: promiseId,
            owner,
            project,
        });
        await loadPromiseEpics(owner, project, promiseId, promise, navContentDiv, contentDiv);


        gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-epic-statement', '#add-epic-submit']);

        loadCommentsAndReactions(detailDiv!, 'Promise', promise.id as number, owner, project, permission!);

        upsertPromiseGraphViewButton(detailDiv, promise);


        initBackLink();

        setupDescriptionHandler(owner, project, promiseId, 'promise', promise as unknown as { sequenceNumber: number; description?: string }, updatePromiseDescription as (owner: string, project: string, id: string, desc: string) => Promise<Record<string, unknown> | undefined>);

        if (loadingElement) loadingElement.hidden = true;
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load promise details.';
        console.error(error);
    }
}
