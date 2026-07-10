import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createJourney } from '../journeys/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { getPromiseById } from '../promises/api.ts';
import { navigate } from '../router.ts';
import { gateDetailControls, getStatusIcon, getStatusLabel, bindLinkClickHandlers, setupDescriptionHandler, buildInlineEditUI, createStatusRow, createDateRow, initBackLink, loadCommentsAndReactions, setElementText, setElementVisibility } from '../utils/detail-common.ts';
import { loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupAddChildForm } from '../utils/inline-add-form.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow } from '../utils/inline-table.ts';

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
 * Load and render the journeys list for an epic.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} epicId - The epic ID
 * @param {Epic} epic - The epic data object
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
async function loadEpicJourneys(owner: string, project: string, epicId: string, epic: Record<string, unknown>, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const journeysList = document.querySelector('#epic-journeys-list') as HTMLElement | null;
    if (!journeysList) return;

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
            renderAddRow: () => '<tr data-inline-add-row="1">'
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

        setupAddChildForm({
            formId: 'add-journey-form',
            inputId: 'add-journey-statement',
            submitButtonId: 'add-journey-submit',
            msgId: 'add-journey-msg',
            owner,
            project,
            tbody,
            onCreate: async (statement) => createJourney(owner, project, {
                statement,
                epicId: (epic as Record<string, unknown>).id as number,
                displayOrder: (journeys || []).length + 1,
            }) as Promise<Record<string, unknown> | null>,
            getRowHtml: (created) => '<tr><td>' + escapeHtml(created.statement as string) + '</td>'
                + '<td><a href="/' + owner + '/' + project + '/journeys/' + created.sequenceNumber + '" journey-id="' + created.id + '" journey-seq="' + created.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td></tr>',
            datasetKey: 'journey-id',
            childMetricsKey: 'epic-' + epic.sequenceNumber,
            items: journeys as unknown as Record<string, unknown>[],
        });

        bindLinkClickHandlers(journeysList, 'a[journey-id]', 'journey-seq', 'journeys', owner, project, navContentDiv, contentDiv);
    } catch {
        journeysList?.replaceChildren();
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
    const detailDiv = document.querySelector('#epic-detail-content') as HTMLElement | null;

    if (!detailDiv) return;
    setElementVisibility('#epic-detail-loading', false);
    setElementText('#error-text', '');

    try {
        destroyDetailStackGraph();
        const epic = await getEpic(owner, project, epicId) as Epic;
        if (!epic) {
            if (loadingElement) { loadingElement.hidden = true; loadingElement.classList.add('d-none'); };
            if (errorElement) errorElement.textContent = 'Epic not found.';
            return;
        }
        await loadEntityLookupMap('Epic', epic.id, owner, project);

        if (loadingElement) { loadingElement.hidden = true; loadingElement.classList.add('d-none'); };

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
        buildInlineEditUI(descTd, '', epic.description || '');
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

        table.append(createStatusRow(epic.statusColor));

        table.append(createDateRow('Created', epic.createdAt));

        table.append(createDateRow('Updated', epic.updatedAt));

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

        if (detailDiv) detailDiv.append(detailCard);

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement;
        const descViewElement = document.querySelector('#description-view') as HTMLElement;
        const editButton = document.querySelector('#edit-desc-btn') as HTMLElement;
        const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
        const cancelButton = document.querySelector('#cancel-desc') as HTMLElement;
        if (descInput && descViewElement && editButton) {
            createCommentAutocomplete(descInput, 'Epic', epic.id);
            const editor = setupInlineEdit(descInput, descViewElement, editButton, saveButton, cancelButton);
            (epic as unknown as Record<string, unknown>).__editor = editor;
        }

        await loadParentPromise(owner, project, epic, navContentDiv, contentDiv);

        await loadEpicJourneys(owner, project, epicId, epic as unknown as Record<string, unknown>, navContentDiv, contentDiv);

        initBackLink();
        gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-journey-statement', '#add-journey-submit']);

        loadCommentsAndReactions(detailDiv, 'Epic', epic.id, owner, project, permission);

        setupDescriptionHandler(owner, project, epicId, 'epic', epic, updateEpicDescription as (owner: string, project: string, id: string, desc: string) => Promise<Record<string, unknown> | undefined>);

        upsertEpicGraphViewButton(detailDiv, epic);
    } catch (error) {
        if (loadingElement) { loadingElement.hidden = true; loadingElement.classList.add('d-none'); };
        if (errorElement) errorElement.textContent = 'Failed to load epic details.';
        console.error(error);
    }
}
