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
import { gateDetailControls, getStatusIcon, getStatusLabel, bindLinkClickHandlers, buildInlineEditUI, createStatusRow, createDateRow, initBackLink, loadCommentsAndReactions, setElementText, setElementVisibility, setupDetailInlineEdit } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupAddChildForm } from '../utils/inline-add-form.ts';
import { renderTableWithInlineAddRow } from '../utils/inline-table.ts';

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
 * Set up the description inline-edit save handler for a journey.
 * @param {Journey} journey - The journey data object (mutated in place)
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} journeyId - The journey ID
 * @param {HTMLButtonElement} saveButton - The save button element
 * @param {HTMLElement | null} descMessage - The save message element
 * @param {{ showSavedPopover?: (html: string) => void } | undefined} editor - The inline edit editor
 * @returns {Promise<void>}
 */
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

/**
 * Load and render the parent epic link for a journey.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {Journey} journey - The journey whose parent epic to load
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {Promise<void>}
 */
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

/**
 * Insert or update the graph view button for a journey.
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {Journey} journey - The journey data
 * @returns {void}
 */
function upsertJourneyGraphViewButton(detailDiv: HTMLElement, journey: Journey): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (go && gp) {
        const href = buildGraphViewHref(go, gp, 'journey-' + journey.sequenceNumber);
        if (href) upsertGraphViewButton(detailDiv, href);
    }
}

/**
 * Load and render the flows list for a journey.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} journeyId - The journey ID
 * @param {Journey} journey - The journey data object
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @param {HTMLElement} flowsList - Container element for the flows list
 * @returns {Promise<void>}
 */
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
            renderAddRow: () => '<tr data-inline-add-row="1">'
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

        setupAddChildForm({
            formId: 'add-flow-form',
            inputId: 'add-flow-statement',
            submitButtonId: 'add-flow-submit',
            msgId: 'add-flow-msg',
            owner,
            project,
            tbody,
            onCreate: async (statement) => createFlow(owner, project, {
                statement,
                journeyId: journey.id,
                displayOrder: (flows || []).length + 1,
            }) as Promise<Record<string, unknown> | null>,
            getRowHtml: (created) => '<tr><td>' + escapeHtml(created.statement as string) + '</td>'
                + '<td><a href="/' + owner + '/' + project + '/flows/' + created.sequenceNumber + '" flow-id="' + created.id + '" flow-seq="' + created.sequenceNumber + '" class="btn btn-sm btn-outline-primary">View</a></td></tr>',
            datasetKey: 'flow-id',
            childMetricsKey: 'journey-' + journey.sequenceNumber,
            items: flows as unknown as Record<string, unknown>[],
        });

        bindLinkClickHandlers(flowsList, 'a[flow-id]', 'flow-seq', 'flows', owner, project, navContentDiv, contentDiv);

    } catch {
        flowsList.replaceChildren();
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Failed to load flows.';
        flowsList.append(p);
    }
}
/**
 * @param {HTMLElement | null} element - The loading element
 * @param {boolean} [isHidden] - Whether to hide
 */
function hideLoading(element: HTMLElement | null, isHidden = true): void {
  if (!element) return;
  element.hidden = isHidden;
  if (isHidden) element.classList.add('d-none');
}

/**
 * @param {HTMLElement | null} element - The error element
 * @param {string} message - The error message
 */
function setErrorMessage(element: HTMLElement | null, message: string): void {
  if (element) element.textContent = message;
}

/**
 * Render the journey detail card and wire up all interactions.
 * @param {Journey} journey - The journey data
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} journeyId - The journey ID
 * @param {HTMLElement} detailDiv - The detail container
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {{ permission: string } | undefined} permission - Permission object
 */
async function renderJourneyDetail(journey: Journey, owner: string, project: string, journeyId: string, detailDiv: HTMLElement, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission: string } | undefined): Promise<void> {
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
  buildInlineEditUI(descTd, '', journey.description || '');
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

  table.append(createStatusRow(journey.statusColor));
  table.append(createDateRow('Created', journey.createdAt));
  table.append(createDateRow('Updated', journey.updatedAt));

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

  detailDiv.append(detailCard);

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

  const epicLinkElement = detailDiv.querySelector('a.detail-link[epic-id]') as HTMLElement;
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

  gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-flow-statement', '#add-flow-submit']);

  loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);

  upsertJourneyGraphViewButton(detailDiv, journey);
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
    const detailDiv = document.querySelector('#journey-detail-content') as HTMLElement | null;
<<<<<<< HEAD
    if (!detailDiv) return;

    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#journey-detail-loading') as HTMLElement | null;
||||||| 4594080
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#journey-detail-loading') as HTMLElement | null;
=======
>>>>>>> 14320ac2f3f231769761f8e43b27f0a7d92b900f

<<<<<<< HEAD
    hideLoading(loadingElement, false);
    setErrorMessage(errorElement, '');
||||||| 4594080
    if (!detailDiv) return;
    if (loadingElement) loadingElement.hidden = false;
    if (errorElement) errorElement.textContent = '';
=======
    if (!detailDiv) return;
    setElementText('#error-text', '');
    setElementVisibility('#journey-detail-loading', false);
>>>>>>> 14320ac2f3f231769761f8e43b27f0a7d92b900f

    try {
        destroyDetailStackGraph();
        const journey = await getJourney(owner, project, journeyId) as Journey;
        if (!journey) {
            hideLoading(loadingElement);
            setErrorMessage(errorElement, 'Journey not found.');
            return;
        }
        await loadEntityLookupMap('Journey', journey.id, owner, project);
        hideLoading(loadingElement);

<<<<<<< HEAD
        await renderJourneyDetail(journey, owner, project, journeyId, detailDiv, navContentDiv, contentDiv, permission);
||||||| 4594080
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
        buildInlineEditUI(descTd, '', journey.description || '');
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

        table.append(createStatusRow(journey.statusColor));

        table.append(createDateRow('Created', journey.createdAt));

        table.append(createDateRow('Updated', journey.updatedAt));

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

        if (detailDiv) detailDiv.append(detailCard);

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

        gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-flow-statement', '#add-flow-submit']);

        loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);

        upsertJourneyGraphViewButton(detailDiv, journey);

        if (loadingElement) { loadingElement.hidden = true; loadingElement.classList.add('d-none'); };
=======
        void mountDetailStackGraph({ nodeType: 'journey', nodeId: journeyId, owner, project });

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
        buildInlineEditUI(descTd, '', journey.description || '');
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

        table.append(createStatusRow(journey.statusColor));
        table.append(createDateRow('Created', journey.createdAt));
        table.append(createDateRow('Updated', journey.updatedAt));

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
        backButton.innerHTML = '<span aria-hidden="true">\u{2190}</span> Back';
        detailCard.append(backButton);

        detailDiv.append(detailCard);

        const editor = setupDetailInlineEdit('#description-input', '#description-view', '#edit-desc-btn', 'Journey', journey.id, '#save-desc', '#cancel-desc');

        bindLinkClickHandlers(document.body, 'a.detail-link[epic-id]', 'epic-seq', 'epics', owner, project, navContentDiv, contentDiv);

        await loadJourneyFlows(owner, project, journeyId, journey, navContentDiv, contentDiv, flowsList);

        initBackLink();
        await loadParentEpic(owner, project, journey, navContentDiv, contentDiv);

        const descMessage = document.querySelector('#desc-save-msg') as HTMLElement;
        const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
        await setupJourneyDescriptionHandler(journey, owner, project, journeyId, saveButton, descMessage, editor);

        gateDetailControls(permission, ['#edit-desc-btn', '#save-desc', '#description-input', '#add-flow-statement', '#add-flow-submit']);
        loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);
        upsertJourneyGraphViewButton(detailDiv, journey);

        if (loadingElement) { loadingElement.hidden = true; loadingElement.classList.add('d-none'); };
>>>>>>> 14320ac2f3f231769761f8e43b27f0a7d92b900f
    } catch (error) {
        hideLoading(loadingElement);
        setErrorMessage(errorElement, 'Failed to load journey details.');
        console.error(error);
    }
}
