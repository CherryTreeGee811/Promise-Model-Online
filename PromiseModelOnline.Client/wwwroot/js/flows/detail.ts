import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { getJourneyById } from '../journeys/api.ts';
import { createMoment, updateMomentType } from '../moments/api.ts';
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

import { getFlow, getMoments, updateFlowDescription } from './api.ts';

interface Flow {
    id: number;
    sequenceNumber: number;
    statement: string;
    description?: string;
    statusColor?: string;
    createdAt: string;
    updatedAt?: string;
    journeyId: number;
}

interface Moment {
    id: number;
    sequenceNumber: number;
    statement: string;
    description?: string;
    statusColor?: string;
    type: string;
    status: string;
}

interface Journey {
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

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} flowId - The flow ID
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {{ permission: string } | undefined} permission - Permission object
 */
export async function loadFlowDetail(owner: string, project: string, flowId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission: string } | undefined): Promise<void> {
    const detailDiv = document.querySelector('#flow-detail-content') as HTMLElement;
    const errorElement = document.querySelector('#error-text') as HTMLElement;
    const loadingElement = document.querySelector('#flow-detail-loading') as HTMLElement;

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    if (errorElement) errorElement.textContent = '';

    try {
        const flow = await getFlow(owner, project, flowId) as Flow;
        await loadEntityLookupMap('Flow', flow.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'flow',
            nodeId: flowId,
            owner,
            project,
        });

        const detailCard = document.createElement('div');
        detailCard.className = 'detail-card flow-detail-card';

        const heading = document.createElement('h2');
        heading.textContent = flow.statement;
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
        descView.append(...htmlToNodes(formatCommentText(flow.description || '')));
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
        descTextarea.textContent = flow.description || '';
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

        const journeyRow = document.createElement('tr');
        const journeyTh = document.createElement('th');
        journeyTh.textContent = 'Journey';
        journeyRow.append(journeyTh);
        const journeyTd = document.createElement('td');
        journeyTd.id = 'flow-journey-cell';
        const journeyLink = document.createElement('a');
        journeyLink.href = `/${owner}/${project}/journeys/${flow.journeyId}`;
        journeyLink.className = 'detail-link link-primary text-decoration-none fw-semibold';
        journeyLink.setAttribute('journey-id', String(flow.journeyId));
        journeyLink.setAttribute('journey-seq', String(flow.journeyId));
        journeyLink.textContent = `Journey ${flow.journeyId}`;
        journeyTd.append(journeyLink);
        journeyRow.append(journeyTd);
        table.append(journeyRow);

        const statusRow = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        statusTh.textContent = 'Status';
        statusRow.append(statusTh);
        const statusTd = document.createElement('td');
        const statusIconSpan = document.createElement('span');
        statusIconSpan.setAttribute('aria-hidden', 'true');
        statusIconSpan.textContent = getStatusIcon(flow.statusColor ?? '');
        statusTd.append(statusIconSpan);
        const statusSrSpan = document.createElement('span');
        statusSrSpan.className = 'sr-only';
        statusSrSpan.textContent = getStatusLabel(flow.statusColor ?? '');
        statusTd.append(statusSrSpan);
        statusRow.append(statusTd);
        table.append(statusRow);

        const createdRow = document.createElement('tr');
        const createdTh = document.createElement('th');
        createdTh.scope = 'row';
        createdTh.textContent = 'Created';
        createdRow.append(createdTh);
        const createdTd = document.createElement('td');
        createdTd.textContent = new Date(flow.createdAt).toLocaleDateString('en-CA');
        createdRow.append(createdTd);
        table.append(createdRow);

        const updatedRow = document.createElement('tr');
        const updatedTh = document.createElement('th');
        updatedTh.scope = 'row';
        updatedTh.textContent = 'Updated';
        updatedRow.append(updatedTh);
        const updatedTd = document.createElement('td');
        updatedTd.textContent = flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('en-CA') : '\u{2013}';
        updatedRow.append(updatedTd);
        table.append(updatedRow);

        detailCard.append(table);

        const momentsHeading = document.createElement('h3');
        momentsHeading.textContent = 'Moments';
        detailCard.append(momentsHeading);

        const momentsList = document.createElement('div');
        momentsList.id = 'flow-moments-list';
        const loadingP = document.createElement('p');
        loadingP.textContent = 'Loading moments...';
        momentsList.append(loadingP);
        detailCard.append(momentsList);

        const commentsDiv = document.createElement('div');
        commentsDiv.id = 'flow-comments';
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
            createCommentAutocomplete(descInput, 'Flow', flow.id);
            editor = setupInlineEdit(descInput, descViewElement, editButton, saveButton, cancelButton);
        }

        const journeyLinkElement = detailDiv?.querySelector('.detail-link[journey-id]') as HTMLElement;
        if (journeyLinkElement) {
            journeyLinkElement.addEventListener('click', (event) => {
                const me = event as MouseEvent;
                if (me.ctrlKey || me.metaKey || me.button === 1) return;
                event.preventDefault();
                void navigate(`/${owner}/${project}/journeys/${journeyLinkElement.getAttribute('journey-seq')}`, navContentDiv, contentDiv);
            });
        }

        try {
            const moments = await getMoments(owner, project, flowId) as Moment[];
            patchChildMetrics(`flow-${flow.sequenceNumber}`, moments as unknown as Record<string, unknown>[]);
            const tbody = renderTableWithInlineAddRow(momentsList, {
                headers: ['Statement', 'Type', 'Status', 'Actions'],
                items: moments || [],
                emptyMessage: 'No moments found for this flow.',
                renderItemRow: (item: unknown) => {
                    const m = item as Moment;
                    return `<tr data-moment-id="${m.sequenceNumber}">
                        <td>${escapeHtml(m.statement)}</td>
                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${m.sequenceNumber}" data-current-type="${m.type}" aria-label="Moment type"><option value="Story" ${m.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${m.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                        <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                        <td><a href="/${owner}/${project}/moments/${m.sequenceNumber}" moment-seq="${m.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                    </tr>`;
                },
                renderAddRow: () => `
                    <tr data-inline-add-row="1">
                        <td>
                            <form id="add-moment-form" class="inline-add-form">
                                <input id="add-moment-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Moment Statement..." aria-label="New moment statement">
                            </form>
                        </td>
                        <td>
                            <select id="add-moment-type" class="form-select form-select-sm" form="add-moment-form">
                                <option value="Story">Story</option>
                                <option value="Job">Job</option>
                            </select>
                        </td>
                        <td><span class="status-badge status-todo">Todo</span></td>
                        <td>
                            <button id="add-moment-submit" type="submit" form="add-moment-form" class="btn btn-sm btn-outline-primary">Add</button>
                            <span id="add-moment-msg"></span>
                        </td>
                    </tr>
                `,
            });

            const form = momentsList.querySelector('#add-moment-form') as HTMLFormElement;
            const statementInput = momentsList.querySelector('#add-moment-statement') as HTMLInputElement;
            const typeSelect = momentsList.querySelector('#add-moment-type') as HTMLSelectElement;
            const message = momentsList.querySelector('#add-moment-msg') as HTMLElement;
            const submitButton = momentsList.querySelector('#add-moment-submit') as HTMLButtonElement;

            if (form && statementInput && typeSelect && message && submitButton) {
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
                        const created = await createMoment(owner, project, {
                            statement,
                            flowId,
                            type: typeSelect.value,
                            status: 'Todo',
                            displayOrder: (moments || []).length + 1,
                        }) as Moment;

                        if (created) {
                            removeInlineEmptyRow(tbody!);
                            const row = document.createElement('tr');
                            row.dataset.momentId = String(created.id);

                            const tdStmt = document.createElement('td');
                            tdStmt.textContent = created.statement;
                            row.append(tdStmt);

                            const tdType = document.createElement('td');
                            const typeSel = document.createElement('select');
                            typeSel.className = 'form-select form-select-sm moment-type-select';
                            typeSel.dataset.momentId = String(created.sequenceNumber);
                            typeSel.dataset.currentType = created.type;
                            typeSel.setAttribute('aria-label', 'Moment type');
                            const optStory = document.createElement('option');
                            optStory.value = 'Story';
                            optStory.textContent = 'Story';
                            if (created.type === 'Story') optStory.selected = true;
                            typeSel.append(optStory);
                            const optJob = document.createElement('option');
                            optJob.value = 'Job';
                            optJob.textContent = 'Job';
                            if (created.type === 'Job') optJob.selected = true;
                            typeSel.append(optJob);
                            tdType.append(typeSel);
                            row.append(tdType);

                            const tdStatus = document.createElement('td');
                            const statusSpan = document.createElement('span');
                            statusSpan.className = `status-badge status-${(created.status || '').toLowerCase()}`;
                            statusSpan.textContent = created.status;
                            tdStatus.append(statusSpan);
                            row.append(tdStatus);

                            const tdActions = document.createElement('td');
                            const viewLink = document.createElement('a');
                            viewLink.href = `/${owner}/${project}/moments/${created.sequenceNumber}`;
                            viewLink.setAttribute('moment-seq', String(created.sequenceNumber));
                            viewLink.className = 'btn btn-sm btn-outline-primary';
                            viewLink.textContent = 'View';
                            tdActions.append(viewLink);
                            row.append(tdActions);

                            insertRowBeforeAddRow(tbody!, row);
                            statementInput.value = '';
                            typeSelect.value = 'Story';
                            patchChildMetrics(`flow-${flow.sequenceNumber}`, [...(moments || []), created] as unknown as Record<string, unknown>[]);
                        }
                    } catch (error) {
                        message.textContent = 'Failed to add moment.';
                        console.error(error);
                    } finally {
                        submitButton.disabled = false;
                    }
                });
            }

            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-responsive';
            const momentTable = document.createElement('table');
            momentTable.className = 'table table-sm table-striped align-middle promisemodel-table';

            const mThead = document.createElement('thead');
            const mHeaderRow = document.createElement('tr');
            const mHeaders = ['Statement', 'Type', 'Status', 'Actions'];
            for (const h of mHeaders) {
                const th = document.createElement('th');
                th.textContent = h;
                mHeaderRow.append(th);
            }
            mThead.append(mHeaderRow);
            momentTable.append(mThead);

            const mTbody = document.createElement('tbody');
            for (const m of moments) {
                const tr = document.createElement('tr');
                tr.dataset.momentId = String(m.sequenceNumber);

                const tdStmt = document.createElement('td');
                tdStmt.textContent = m.statement;
                tr.append(tdStmt);

                const tdType = document.createElement('td');
                const typeSel = document.createElement('select');
                typeSel.className = 'form-select form-select-sm moment-type-select';
                typeSel.dataset.momentId = String(m.sequenceNumber);
                typeSel.dataset.currentType = m.type;
                typeSel.setAttribute('aria-label', 'Moment type');
                const optStory = document.createElement('option');
                optStory.value = 'Story';
                optStory.textContent = 'Story';
                if (m.type === 'Story') optStory.selected = true;
                typeSel.append(optStory);
                const optJob = document.createElement('option');
                optJob.value = 'Job';
                optJob.textContent = 'Job';
                if (m.type === 'Job') optJob.selected = true;
                typeSel.append(optJob);
                tdType.append(typeSel);
                tr.append(tdType);

                const tdStatus = document.createElement('td');
                const statusSpan = document.createElement('span');
                statusSpan.className = `status-badge status-${(m.status || '').toLowerCase()}`;
                statusSpan.textContent = m.status;
                tdStatus.append(statusSpan);
                tr.append(tdStatus);

                const tdActions = document.createElement('td');
                const viewLink = document.createElement('a');
                viewLink.href = `/${owner}/${project}/moments/${m.sequenceNumber}`;
                viewLink.setAttribute('moment-id', String(m.id));
                viewLink.setAttribute('moment-seq', String(m.sequenceNumber));
                viewLink.className = 'btn btn-sm btn-outline-primary';
                viewLink.textContent = 'View';
                tdActions.append(viewLink);
                tr.append(tdActions);

                mTbody.append(tr);
            }
            momentTable.append(mTbody);
            tableWrapper.append(momentTable);
            momentsList.replaceChildren(tableWrapper);

            momentsList.addEventListener('change', async (event) => {
                const target = event.target as HTMLElement;
                if (target.matches('.moment-type-select')) {
                    const momentId = parseInt(target.dataset.momentId!, 10);
                    const newType = (target as HTMLSelectElement).value;
                    const previous = target.dataset.currentType || newType;
                    try {
                        await updateMomentType(owner, project, momentId, newType);
                        target.dataset.currentType = newType;
                    } catch (error) {
                        (target as HTMLSelectElement).value = previous;
                        console.error('Failed to update moment type:', error);
                    }
                }
            });

            for (const link of momentsList.querySelectorAll('a[moment-id]')) {
                link.addEventListener('click', (event) => {
                    const me = event as MouseEvent;
                    if (me.ctrlKey || me.metaKey || me.button === 1) return;
                    event.preventDefault();
                    void navigate(`/${owner}/${project}/moments/${link.getAttribute('moment-seq')}`, navContentDiv, contentDiv);
                });
            }
        } catch {
            momentsList.replaceChildren();
            const p = document.createElement('p');
            p.className = 'error';
            p.textContent = 'Failed to load moments.';
            momentsList.append(p);
        }

        initBackLink();

        const journeyCell = document.querySelector('#flow-journey-cell') as HTMLElement;
        try {
            const journey = await getJourneyById(owner, project, flow.journeyId) as Journey;
            const icon = getStatusIcon(journey.statusColor ?? '');
            const label = getStatusLabel(journey.statusColor ?? '');
            if (journeyCell) journeyCell.replaceChildren();
            const link = document.createElement('a');
            link.href = `/${owner}/${project}/journeys/${journey.sequenceNumber}`;
            link.className = 'detail-link link-primary text-decoration-none fw-semibold';
            link.textContent = journey.statement;
            if (journeyCell) journeyCell.append(link);
            const statusSpan = document.createElement('span');
            statusSpan.setAttribute('aria-hidden', 'true');
            statusSpan.textContent = icon;
            if (journeyCell) journeyCell.append(statusSpan);
            const srSpan = document.createElement('span');
            srSpan.className = 'sr-only';
            srSpan.textContent = label;
            if (journeyCell) journeyCell.append(srSpan);

            const linkElement = journeyCell?.querySelector('a.detail-link') as HTMLElement;
            if (linkElement) {
                linkElement.addEventListener('click', (event) => {
                    const me = event as MouseEvent;
                    if (me.ctrlKey || me.metaKey || me.button === 1) return;
                    event.preventDefault();
                    void navigate(linkElement.getAttribute('href')!, navContentDiv, contentDiv);
                });
            }
        } catch {}

        const descMessage = document.querySelector('#desc-save-msg') as HTMLElement;
        if (saveButton) {
            saveButton.addEventListener('click', async (event) => {
                event.preventDefault();
                if (descMessage) descMessage.textContent = '';
                saveButton.disabled = true;
                const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
                try {
                    const updated = await updateFlowDescription(owner, project, flowId, newDesc) as { description?: string } | undefined;
                    flow.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                    patchDetailStackGraphNode(`flow-${flow.sequenceNumber}`, {
                        description: flow.description,
                    });
                    if (editor?.showSavedPopover) editor.showSavedPopover(formatCommentText(flow.description || ''));
                } catch (error) {
                    if (descMessage) descMessage.textContent = 'Save failed';
                    console.error(error);
                } finally {
                    saveButton.disabled = false;
                }
            });
        }

        (function gateFlowDetailControls() {
            const canEdit = permission?.permission === 'Edit';
            if (!canEdit) {
                const editButton__ = document.querySelector('#edit-desc-btn') as HTMLButtonElement;
                const saveButton__ = document.querySelector('#save-desc') as HTMLButtonElement;
                const descInp = document.querySelector('#description-input') as HTMLInputElement;
                if (editButton__) { editButton__.disabled = true; editButton__.title = 'Requires Edit permission.'; }
                if (saveButton__) { saveButton__.disabled = true; saveButton__.title = 'Requires Edit permission.'; }
                if (descInp) descInp.disabled = true;

                const momentStatementInput = document.querySelector('#add-moment-statement') as HTMLInputElement;
                const momentSubmitButton = document.querySelector('#add-moment-submit') as HTMLButtonElement;
                if (momentStatementInput) momentStatementInput.disabled = true;
                if (momentSubmitButton) { momentSubmitButton.disabled = true; momentSubmitButton.title = 'Requires Edit permission.'; }

                const momentTypeSelect = document.querySelector('#add-moment-type') as HTMLSelectElement;
                if (momentTypeSelect) momentTypeSelect.disabled = true;
            }
        })();

        loadCommentsAndReactions(detailDiv, 'Flow', flow.id, owner, project, permission);

        const { owner: go, project: gp } = getOwnerProjectFromPath();
        if (go && gp) {
            const href = buildGraphViewHref(go, gp, `flow-${flow.sequenceNumber}`);
            if (href) upsertGraphViewButton(detailDiv, href);
        }
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load flow details.';
        console.error(error);
    }
}
