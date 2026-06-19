import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { getEpicById } from '../epics/api.ts';
import { createFlow } from '../flows/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getJourney, getFlows, updateJourneyDescription } from './api.ts';

interface Journey {
    id: number;
    sequenceNumber: number;
    statement: string;
    description?: string;
    statusColor?: string;
    createdAt: string;
    updatedAt?: string;
    epicId: number;
}

interface FlowItem {
    id: number;
    sequenceNumber: number;
    statement: string;
}

interface EpicItem {
    id: number;
    sequenceNumber: number;
    statement: string;
    statusColor?: string;
}

/**
 * @param {string} html - HTML string to parse
 * @returns {Node[]} Array of child nodes
 */
function htmlToNodes(html: string): Node[] {
    const document_ = new DOMParser().parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    fragment.append(...document_.body.childNodes);
    return [...fragment.childNodes];
}

function gateJourneyDetailControls(permission: { permission: string } | undefined): void {
    const canEdit = permission?.permission === 'Edit';
    if (!canEdit) {
        const editButton__ = document.querySelector('#edit-desc-btn') as HTMLButtonElement;
        const saveButton__ = document.querySelector('#save-desc') as HTMLButtonElement;
        const descInp = document.querySelector('#description-input') as HTMLInputElement;
        if (editButton__) { editButton__.disabled = true; editButton__.title = 'Requires Edit permission.'; }
        if (saveButton__) { saveButton__.disabled = true; saveButton__.title = 'Requires Edit permission.'; }
        if (descInp) descInp.disabled = true;

        const flowStatementInput = document.querySelector('#add-flow-statement') as HTMLInputElement;
        const flowSubmitButton = document.querySelector('#add-flow-submit') as HTMLButtonElement;
        if (flowStatementInput) flowStatementInput.disabled = true;
        if (flowSubmitButton) { flowSubmitButton.disabled = true; flowSubmitButton.title = 'Requires Edit permission.'; }
    }
}

async function setupJourneyDescriptionHandler(journey: Journey, owner: string, project: string, journeyId: string, saveButton: HTMLButtonElement, descMessage: HTMLElement | null, editor: { showSavedPopover?: (html: string) => void } | undefined): Promise<void> {
    if (saveButton) {
        saveButton.addEventListener('click', async (event) => {
            event.preventDefault();
            if (descMessage) descMessage.textContent = '';
            saveButton.disabled = true;
            const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
            try {
                const updated = await updateJourneyDescription(owner, project, journeyId, newDesc) as { description?: string } | undefined;
                journey.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                patchDetailStackGraphNode('journey-' + journey.sequenceNumber, {
                    description: journey.description,
                });
                if (editor?.showSavedPopover) editor.showSavedPopover(formatCommentText(journey.description || ''));
            } catch (error) {
                if (descMessage) descMessage.textContent = 'Save failed';
                console.error(error);
            } finally {
                saveButton.disabled = false;
            }
        });
    }
}

function bindFlowClickHandlers(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, flowsList: HTMLElement): void {
    for (const link of flowsList.querySelectorAll('a[flow-id]')) {
        link.addEventListener('click', (event) => {
            const me = event as MouseEvent;
            if (me.ctrlKey || me.metaKey || me.button === 1) return;
            event.preventDefault();
            void navigate('/' + owner + '/' + project + '/flows/' + link.getAttribute('flow-seq'), navContentDiv, contentDiv);
        });
    }
}

async function loadParentEpic(owner: string, project: string, journey: Journey, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const epicCell = document.querySelector('#journey-epic-cell') as HTMLElement;
    try {
        const epic = await getEpicById(owner, project, journey.epicId) as EpicItem;
        const icon = getStatusIcon(epic.statusColor ?? '');
        const label = getStatusLabel(epic.statusColor ?? '');
        if (epicCell) epicCell.replaceChildren();
        const link = document.createElement('a');
        link.href = '/' + owner + '/' + project + '/epics/' + epic.sequenceNumber;
        link.className = 'detail-link link-primary text-decoration-none fw-semibold';
        link.textContent = epic.statement;
        if (epicCell) epicCell.append(link);
        const statusSpan = document.createElement('span');
        statusSpan.setAttribute('aria-hidden', 'true');
        statusSpan.textContent = icon;
        if (epicCell) epicCell.append(statusSpan);
        const srSpan = document.createElement('span');
        srSpan.className = 'sr-only';
        srSpan.textContent = label;
        if (epicCell) epicCell.append(srSpan);

        if (link) {
            link.addEventListener('click', (event) => {
                const me = event as MouseEvent;
                if (me.ctrlKey || me.metaKey || me.button === 1) return;
                event.preventDefault();
                void navigate(link.getAttribute('href')!, navContentDiv, contentDiv);
            });
        }
    } catch {}
}

function upsertJourneyGraphViewButton(detailDiv: HTMLElement, journey: Journey): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (go && gp) {
        const href = buildGraphViewHref(go, gp, 'journey-' + journey.sequenceNumber);
        if (href) upsertGraphViewButton(detailDiv, href);
    }
}

function setupFlowFormHandler(owner: string, project: string, journeyId: string, journey: Journey, flows: FlowItem[], tbody: HTMLElement | null): void {
    const form = document.querySelector('#add-flow-form') as HTMLFormElement;
    const statementInput = document.querySelector('#add-flow-statement') as HTMLInputElement;
    const message = document.querySelector('#add-flow-msg') as HTMLElement;
    const submitButton = document.querySelector('#add-flow-submit') as HTMLButtonElement;

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
                const created = await createFlow(owner, project, {
                    statement,
                    journeyId,
                    displayOrder: (flows || []).length + 1,
                }) as FlowItem;

                if (created) {
                    removeInlineEmptyRow(tbody!);
                    const row = document.createElement('tr');
                    row.dataset.flowId = String(created.id);

                    const tdStmt = document.createElement('td');
                    tdStmt.textContent = created.statement;
                    row.append(tdStmt);

                    const tdActions = document.createElement('td');
                    const viewLink = document.createElement('a');
                    viewLink.href = '/' + owner + '/' + project + '/flows/' + created.sequenceNumber;
                    viewLink.setAttribute('flow-id', String(created.id));
                    viewLink.setAttribute('flow-seq', String(created.sequenceNumber));
                    viewLink.className = 'btn btn-sm btn-outline-primary';
                    viewLink.textContent = 'View';
                    tdActions.append(viewLink);
                    row.append(tdActions);

                    insertRowBeforeAddRow(tbody!, row);
                    statementInput.value = '';
                    patchChildMetrics('journey-' + journey.sequenceNumber, [...(flows || []), created] as unknown as Record<string, unknown>[]);
                }
            } catch (error) {
                message.textContent = 'Failed to add flow.';
                console.error(error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }
}

async function loadJourneyFlows(owner: string, project: string, journeyId: string, journey: Journey, navContentDiv: HTMLElement, contentDiv: HTMLElement, flowsList: HTMLElement): Promise<void> {
    try {
        const flows = await getFlows(owner, project, journeyId) as FlowItem[];
        patchChildMetrics('journey-' + journey.sequenceNumber, flows as unknown as Record<string, unknown>[]);
        const tbody = renderTableWithInlineAddRow(flowsList, {
            headers: ['Statement', 'Actions'],
            items: flows || [],
            emptyMessage: 'No flows found for this journey.',
            renderItemRow: (item: unknown) => {
                const f = item as FlowItem;
                return '<tr data-flow-id="' + f.id + '">'
                    + '<td>' + escapeHtml(f.statement) + '</td>'
                    + '<td><a href="/' + owner + '/' + project + '/flows/' + f.sequenceNumber + '" flow-id="' + f.id + '" flow-seq="' + f.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td>'
                    + '</tr>';
            },
            renderAddRow: () => ''
                + '<tr data-inline-add-row="1">'
                + '<td>'
                + '<form id="add-flow-form" class="inline-add-form">'
                + '<input id="add-flow-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Flow Statement..." aria-label="New flow statement">'
                + '</form>'
                + '</td>'
                + '<td>'
                + '<button id="add-flow-submit" type="submit" form="add-flow-form" class="btn btn-sm btn-outline-primary">Add</button>'
                + '<span id="add-flow-msg"></span>'
                + '</td>'
                + '</tr>',
        });

        setupFlowFormHandler(owner, project, journeyId, journey, flows || [], tbody);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-responsive';
        const flowTable = document.createElement('table');
        flowTable.className = 'table table-sm table-striped align-middle promisemodel-table';

        const fThead = document.createElement('thead');
        const fHeaderRow = document.createElement('tr');
        const fHeaders = ['Statement', 'Actions'];
        for (const h of fHeaders) {
            const th = document.createElement('th');
            th.textContent = h;
            fHeaderRow.append(th);
        }
        fThead.append(fHeaderRow);
        flowTable.append(fThead);

        const fTbody = document.createElement('tbody');
        for (const f of flows) {
            const tr = document.createElement('tr');
            const tdStmt = document.createElement('td');
            tdStmt.textContent = f.statement;
            tr.append(tdStmt);

            const tdActions = document.createElement('td');
            const viewLink = document.createElement('a');
            viewLink.href = '/' + owner + '/' + project + '/flows/' + f.sequenceNumber;
            viewLink.setAttribute('flow-id', String(f.id));
            viewLink.setAttribute('flow-seq', String(f.sequenceNumber));
            viewLink.className = 'btn btn-sm btn-outline-primary';
            viewLink.textContent = 'View';
            tdActions.append(viewLink);
            tr.append(tdActions);

            fTbody.append(tr);
        }
        flowTable.append(fTbody);
        tableWrapper.append(flowTable);
        flowsList.replaceChildren(tableWrapper);

        bindFlowClickHandlers(owner, project, navContentDiv, contentDiv, flowsList);

    } catch {
        flowsList.replaceChildren();
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Failed to load flows.';
        flowsList.append(p);
    }
}

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} journeyId - The journey ID
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {{ permission: string } | undefined} permission - Permission object
 */
export async function loadJourneyDetail(owner: string, project: string, journeyId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission: string } | undefined): Promise<void> {
    const detailDiv = document.querySelector('#journey-detail-content') as HTMLElement;
    const errorElement = document.querySelector('#error-text') as HTMLElement;
    const loadingElement = document.querySelector('#journey-detail-loading') as HTMLElement;

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    if (errorElement) errorElement.textContent = '';

    try {
        const journey = await getJourney(owner, project, journeyId) as Journey;
        await loadEntityLookupMap('Journey', journey.id, owner, project);
        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'journey',
            nodeId: journeyId,
            owner,
            project,
        });

        const detailCard = document.createElement('div');
        detailCard.className = 'detail-card journey-detail-card';

        const heading = document.createElement('h2');
        heading.textContent = journey.statement;
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
        descView.append(...htmlToNodes(formatCommentText(journey.description || '')));
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
        descTextarea.textContent = journey.description || '';
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

        const epicRow = document.createElement('tr');
        const epicTh = document.createElement('th');
        epicTh.textContent = 'Epic';
        epicRow.append(epicTh);
        const epicTd = document.createElement('td');
        epicTd.id = 'journey-epic-cell';
        const epicLink = document.createElement('a');
        epicLink.href = `/${owner}/${project}/epics/${journey.epicId}`;
        epicLink.className = 'detail-link link-primary text-decoration-none fw-semibold';
        epicLink.setAttribute('epic-id', String(journey.epicId));
        epicLink.setAttribute('epic-seq', String(journey.epicId));
        epicLink.textContent = `Epic ${journey.epicId}`;
        epicTd.append(epicLink);
        epicRow.append(epicTd);
        table.append(epicRow);

        const statusRow = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        statusTh.textContent = 'Status';
        statusRow.append(statusTh);
        const statusTd = document.createElement('td');
        const statusIconSpan = document.createElement('span');
        statusIconSpan.setAttribute('aria-hidden', 'true');
        statusIconSpan.textContent = getStatusIcon(journey.statusColor ?? '');
        statusTd.append(statusIconSpan);
        const statusSrSpan = document.createElement('span');
        statusSrSpan.className = 'sr-only';
        statusSrSpan.textContent = getStatusLabel(journey.statusColor ?? '');
        statusTd.append(statusSrSpan);
        statusRow.append(statusTd);
        table.append(statusRow);

        const createdRow = document.createElement('tr');
        const createdTh = document.createElement('th');
        createdTh.scope = 'row';
        createdTh.textContent = 'Created';
        createdRow.append(createdTh);
        const createdTd = document.createElement('td');
        createdTd.textContent = new Date(journey.createdAt).toLocaleDateString('en-CA');
        createdRow.append(createdTd);
        table.append(createdRow);

        const updatedRow = document.createElement('tr');
        const updatedTh = document.createElement('th');
        updatedTh.scope = 'row';
        updatedTh.textContent = 'Updated';
        updatedRow.append(updatedTh);
        const updatedTd = document.createElement('td');
        updatedTd.textContent = journey.updatedAt ? new Date(journey.updatedAt).toLocaleDateString('en-CA') : '\u{2013}';
        updatedRow.append(updatedTd);
        table.append(updatedRow);

        detailCard.append(table);

        const flowsHeading = document.createElement('h3');
        flowsHeading.textContent = 'Flows';
        detailCard.append(flowsHeading);

        const flowsList = document.createElement('div');
        flowsList.id = 'journey-flows-list';
        const loadingP = document.createElement('p');
        loadingP.textContent = 'Loading flows...';
        flowsList.append(loadingP);
        detailCard.append(flowsList);

        const commentsDiv = document.createElement('div');
        commentsDiv.id = 'journey-comments';
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
        let editor: { showSavedPopover?: (html: string) => void } | undefined;
        if (descInput && descViewElement && editButton) {
            createCommentAutocomplete(descInput, 'Journey', journey.id);
            editor = setupInlineEdit(descInput, descViewElement, editButton, saveButton, cancelButton);
        }

        const epicLinkElement = detailDiv?.querySelector('a.detail-link[epic-id]') as HTMLElement;
        if (epicLinkElement) {
            epicLinkElement.addEventListener('click', (event) => {
                const me = event as MouseEvent;
                if (me.ctrlKey || me.metaKey || me.button === 1) return;
                event.preventDefault();
                void navigate('/' + owner + '/' + project + '/epics/' + epicLinkElement.getAttribute('epic-seq'), navContentDiv, contentDiv);
            });
        }

        await loadJourneyFlows(owner, project, journeyId, journey, navContentDiv, contentDiv, flowsList);

        initBackLink();

        await loadParentEpic(owner, project, journey, navContentDiv, contentDiv);

        const descMessage = document.querySelector('#desc-save-msg') as HTMLElement;
        await setupJourneyDescriptionHandler(journey, owner, project, journeyId, saveButton, descMessage, editor);

        gateJourneyDetailControls(permission);

        loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);

        upsertJourneyGraphViewButton(detailDiv, journey);

        if (loadingElement) loadingElement.hidden = true;
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load journey details.';
        console.error(error);
    }
}
