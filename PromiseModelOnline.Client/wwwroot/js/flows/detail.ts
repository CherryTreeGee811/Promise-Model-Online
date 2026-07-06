import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { getJourneyById } from '../journeys/api.ts';
import { createMoment, updateMomentType } from '../moments/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { gateDetailControls, getStatusIcon, getStatusLabel, bindLinkClickHandlers, setupDescriptionHandler, buildInlineEditUI, createDateRow, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupAddChildForm } from '../utils/inline-add-form.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow } from '../utils/inline-table.ts';

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
 * Handle moment type <select> changes by updating via the API.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @returns {void}
 */
function setupMomentTypeChangeHandler(owner: string, project: string, flowId: string): void {
    const momentsList = document.querySelector('#flow-moments-list') as HTMLElement;
    if (momentsList) {
        momentsList.addEventListener('change', async (event) => {
            const target = event.target as HTMLElement;
            if (target.matches('.moment-type-select')) {
                const momentId = Number(target.dataset.momentId!);
                const newType = (target as HTMLSelectElement).value;
                const previous = target.dataset.currentType || newType;
                try {
                    await updateMomentType(owner, project, momentId, newType, Number(flowId));
                    target.dataset.currentType = newType;
                } catch (error) {
                    (target as HTMLSelectElement).value = previous;
                    console.error('Failed to update moment type:', error);
                }
            }
        });
    }
}

/**
 * Load and render the parent journey name for a flow.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {Flow} flow - The flow whose parent journey to load
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadFlowJourneyName(owner: string, project: string, flow: Flow, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const journeyCell = document.querySelector('#flow-journey-cell') as HTMLElement;
    try {
        const journey = await getJourneyById(owner, project, flow.journeyId) as Journey;
        const icon = getStatusIcon(journey.statusColor ?? '');
        const label = getStatusLabel(journey.statusColor ?? '');
        if (journeyCell) journeyCell.replaceChildren();
        const link = document.createElement('a');
        link.href = '/' + owner + '/' + project + '/journeys/' + journey.sequenceNumber;
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
}

/**
 * Load and render the moments list for a flow.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} flowId - The flow ID
 * @param {Flow} flow - The flow data object
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadFlowMoments(owner: string, project: string, flowId: string, flow: Record<string, unknown>, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const momentsList = document.querySelector('#flow-moments-list') as HTMLElement;

    try {
        const moments = await getMoments(owner, project, flowId) as Moment[];
        patchChildMetrics('flow-' + flow.sequenceNumber, moments as unknown as Record<string, unknown>[]);
        const tbody = renderTableWithInlineAddRow(momentsList, {
            headers: ['Statement', 'Type', 'Status', 'Actions'],
            items: moments || [],
            emptyMessage: 'No moments found for this flow.',
            renderItemRow: (item: unknown) => {
                const m = item as Moment;
                return '<tr data-moment-id="' + m.sequenceNumber + '">'
                    + '<td>' + escapeHtml(m.statement) + '</td>'
                    + '<td><select class="form-select form-select-sm moment-type-select" data-moment-id="' + m.sequenceNumber + '" data-current-type="' + m.type + '" aria-label="Moment type"><option value="Story"' + (m.type === 'Story' ? ' selected' : '') + '>Story</option><option value="Job"' + (m.type === 'Job' ? ' selected' : '') + '>Job</option></select></td>'
                    + '<td><span class="status-badge status-' + (m.status || '').toLowerCase() + '">' + m.status + '</span></td>'
                    + '<td><a href="/' + owner + '/' + project + '/moments/' + m.sequenceNumber + '" moment-seq="' + m.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td>'
                    + '</tr>';
            },
            renderAddRow: () => '<tr data-inline-add-row="1">'
                + '<td>'
                + '<form id="add-moment-form" class="inline-add-form">'
                + '<input id="add-moment-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Moment Statement..." aria-label="New moment statement">'
                + '</form>'
                + '</td>'
                + '<td>'
                + '<select id="add-moment-type" class="form-select form-select-sm" form="add-moment-form">'
                + '<option value="Story">Story</option>'
                + '<option value="Job">Job</option>'
                + '</select>'
                + '</td>'
                + '<td><span class="status-badge status-todo">Todo</span></td>'
                + '<td>'
                + '<button id="add-moment-submit" type="submit" form="add-moment-form" class="btn btn-sm btn-outline-primary">Add</button>'
                + '<span id="add-moment-msg"></span>'
                + '</td>'
                + '</tr>',
        });

        setupAddChildForm({
            formId: 'add-moment-form',
            inputId: 'add-moment-statement',
            submitButtonId: 'add-moment-submit',
            msgId: 'add-moment-msg',
            typeSelectId: 'add-moment-type',
            owner,
            project,
            tbody,
            onCreate: async (statement, type) => createMoment(owner, project, {
                statement,
                flowId: (flow as Record<string, unknown>).id as number,
                type: type ?? 'Story',
                status: 'Todo',
                displayOrder: (moments || []).length + 1,
            }) as Promise<Record<string, unknown> | null>,
            getRowHtml: (created) => '<tr><td>' + escapeHtml(created.statement as string) + '</td>'
                + '<td><select class="form-select form-select-sm moment-type-select" data-moment-id="' + created.sequenceNumber + '" data-current-type="' + created.type + '" aria-label="Moment type">'
                + '<option value="Story"' + (created.type === 'Story' ? ' selected' : '') + '>Story</option>'
                + '<option value="Job"' + (created.type === 'Job' ? ' selected' : '') + '>Job</option>'
                + '</select></td>'
                + '<td><span class="status-badge status-' + ((created.status as string) || '').toLowerCase() + '">' + created.status + '</span></td>'
                + '<td><a href="/' + owner + '/' + project + '/moments/' + created.sequenceNumber + '" moment-seq="' + created.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td></tr>',
            datasetKey: 'moment-id',
            childMetricsKey: 'flow-' + flow.sequenceNumber,
            items: moments as unknown as Record<string, unknown>[],
        });

        setupMomentTypeChangeHandler(owner, project, flowId);
        bindLinkClickHandlers(momentsList, 'a[moment-id]', 'moment-seq', 'moments', owner, project, navContentDiv, contentDiv);
    } catch {
        momentsList?.replaceChildren();
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Failed to load moments.';
        momentsList.append(p);
    }
}

/**
 * Insert or update the graph view button for a flow.
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {Flow} flow - The flow data
 * @returns {void}
 */
function upsertFlowGraphViewButton(detailDiv: HTMLElement, flow: Flow): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (go && gp) {
        const href = buildGraphViewHref(go, gp, 'flow-' + flow.sequenceNumber);
        if (href) upsertGraphViewButton(detailDiv, href);
    }
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
    const detailDiv = document.querySelector('#flow-detail-content') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#flow-detail-loading') as HTMLElement | null;

    destroyDetailStackGraph();
    if (!detailDiv) return;
    if (loadingElement) loadingElement.hidden = false;
    if (errorElement) errorElement.textContent = '';

    try {
        const flow = await getFlow(owner, project, flowId) as Flow;
        if (!flow) return;
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
        buildInlineEditUI(descTd, '', flow.description || '');
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

        table.append(createDateRow('Created', flow.createdAt));
        table.append(createDateRow('Updated', flow.updatedAt));

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

        if (detailDiv) detailDiv.append(detailCard);

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement;
        const descViewElement = document.querySelector('#description-view') as HTMLElement;
        const editButton = document.querySelector('#edit-desc-btn') as HTMLElement;
        const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
        const cancelButton = document.querySelector('#cancel-desc') as HTMLElement;
        if (descInput && descViewElement && editButton) {
            createCommentAutocomplete(descInput, 'Flow', flow.id);
            const editor = setupInlineEdit(descInput, descViewElement, editButton, saveButton, cancelButton);
            (flow as unknown as Record<string, unknown>).__editor = editor;
        }

        bindLinkClickHandlers(document.body, '.detail-link[journey-id]', 'journey-seq', 'journeys', owner, project, navContentDiv, contentDiv);

        await loadFlowMoments(owner, project, flowId, flow as unknown as Record<string, unknown>, navContentDiv, contentDiv);

        initBackLink();

        await loadFlowJourneyName(owner, project, flow, navContentDiv, contentDiv);

        setupDescriptionHandler(owner, project, flowId, 'flow', flow, updateFlowDescription as (owner: string, project: string, id: string, desc: string) => Promise<Record<string, unknown> | undefined>);

        gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-moment-statement', '#add-moment-submit', '#add-moment-type']);

        loadCommentsAndReactions(detailDiv, 'Flow', flow.id, owner, project, permission);

        upsertFlowGraphViewButton(detailDiv, flow);
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load flow details.';
        console.error(error);
    }
}
