import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { loadComments } from '../comments/comments.ts';
import { patchDetailStackGraphNode } from '../projects/detail-stack-graph.ts';
import { loadReactions } from '../reactions/reactions.ts';
import { navigate } from '../router.ts';

import { formatCommentText } from './entity-reference.ts';
import { htmlToNodes } from './html.ts';
import { setupInlineEdit } from './inline-edit.ts';
import { getStatusIcon, getStatusLabel } from './status-utilities.ts';

/**
 * Disable detail page controls when user lacks Edit permission.
 * @param {{ permission: string } | undefined | null} permission - The user's permission object
 * @param {string[]} selectors - CSS selector strings for elements to disable
 * @returns {void}
 */
export function gateDetailControls(permission: { permission?: string } | undefined | null, selectors: string[]): void {
    const canEdit = permission?.permission === 'Edit';
    if (!canEdit) {
        for (const selector of selectors) {
            const element = document.querySelector(selector) as HTMLElement | null;
            if (element) {
                (element as HTMLInputElement).disabled = true;
                element.title = 'Requires Edit permission.';
            }
        }
    }
}

/**
 * Bind click handlers for child-entity links to enable client-side routing.
 * @param {HTMLElement} container - The container element to query for links
 * @param {string} linkSelector - CSS selector for links (e.g. 'a[journey-id]')
 * @param {string} seqAttribute - Attribute name holding the sequence number (e.g. 'journey-seq')
 * @param {string} pathPrefix - URL path segment (e.g. 'journeys')
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {HTMLElement} navContentDiv - Navigation container for routing
 * @param {HTMLElement} contentDiv - Content container for routing
 * @returns {void}
 */
export function bindLinkClickHandlers(container: HTMLElement, linkSelector: string, seqAttribute: string, pathPrefix: string, owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    for (const link of container.querySelectorAll(linkSelector)) {
        link.addEventListener('click', (event) => {
            const me = event as MouseEvent;
            if (me.ctrlKey || me.metaKey || me.button === 1) return;
            event.preventDefault();
            void navigate('/' + owner + '/' + project + '/' + pathPrefix + '/' + link.getAttribute(seqAttribute), navContentDiv, contentDiv);
        });
    }
}

/**
 * Set the hidden state of an element identified by selector.
 * @param {string} selector - CSS selector for the element.
 * @param {boolean} isHidden - Whether to hide the element.
 */
export function setElementVisibility(selector: string, isHidden: boolean): void {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
        element.hidden = isHidden;
        element.style.display = isHidden ? 'none' : '';
    }
}

/**
 * Set the text content of an element identified by selector.
 * @param {string} selector - CSS selector for the element.
 * @param {string} text - The text to set.
 */
export function setElementText(selector: string, text: string): void {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) element.textContent = text;
}

/**
 * Wire up inline edit for a detail description field.
 * @param {string} inputSelector - CSS selector for the textarea element.
 * @param {string} viewSelector - CSS selector for the view element.
 * @param {string} editSelector - CSS selector for the edit button.
 * @param {string} entityType - Entity type for autocomplete.
 * @param {string} entityId - Entity ID for autocomplete.
 * @param {string} [saveSelector] - Optional CSS selector for the save button.
 * @param {string} [cancelSelector] - Optional CSS selector for the cancel button.
 * @returns {ReturnType<typeof setupInlineEdit> | undefined} The inline edit instance, or undefined if elements missing.
 */
export function setupDetailInlineEdit(
    inputSelector: string,
    viewSelector: string,
    editSelector: string,
    entityType: string,
    entityId: string | number,
    saveSelector?: string,
    cancelSelector?: string,
): ReturnType<typeof setupInlineEdit> | undefined {
    const input = document.querySelector(inputSelector) as HTMLTextAreaElement;
    const view = document.querySelector(viewSelector) as HTMLElement;
    const editButton = document.querySelector(editSelector) as HTMLElement;
    if (!input || !view || !editButton) return;
    createCommentAutocomplete(input, entityType, entityId);
    const save = saveSelector ? document.querySelector(saveSelector) as HTMLElement : undefined;
    const cancel = cancelSelector ? document.querySelector(cancelSelector) as HTMLElement : undefined;
    return setupInlineEdit(input, view, editButton, save, cancel);
}

/**
 *
 */
export function initBackLink(): void {
    const backLink = document.querySelector('#back-link');
    if (backLink) {
        backLink.addEventListener('click', () => history.back());
    }
}

/**
 * Load the comments list and reactions section for a detail page.
 * @param {HTMLElement} detailDiv - The main detail container element.
 * @param {string} entityType - Entity type (e.g. "promise", "epic").
 * @param {number} entityId - Numeric entity database ID.
 * @param {string} owner - Project owner slug.
 * @param {string} project - Project slug.
 * @param {Record<string, unknown> } permission - User's permission object for the project.
 */
export function loadCommentsAndReactions(detailDiv: HTMLElement, entityType: string, entityId: number, owner: string, project: string, permission?: Record<string, unknown>): void {
    const commentsContainer = document.querySelector(`#${entityType.toLowerCase()}-comments`) as HTMLElement;
    if (commentsContainer) void loadComments(commentsContainer, entityType, entityId, owner, project, permission);

    let reactionsContainer = document.querySelector('#reactions-section') as HTMLElement;
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.id = 'reactions-section';
    }
    if (detailDiv) {
        if (!reactionsContainer.parentNode) detailDiv.append(reactionsContainer);
        loadReactions(reactionsContainer, entityType, String(entityId), owner, project, (permission ?? {}) as { permission?: string });
    }
}

/**
 * Build the description inline-edit UI elements and append them to a description cell.
 * @param {HTMLTableCellElement} descTd - The `<td>` element to append the editor to
 * @param {string} idPrefix - ID prefix (e.g. '' for standard, 'moment-' for moments)
 * @param {string} description - The current description text
 * @returns {object} The created editor elements (descTextarea, cancelButton, saveButton, saveMessage).
 */
export function buildInlineEditUI(descTd: HTMLTableCellElement, idPrefix: string, description: string): {
    descTextarea: HTMLTextAreaElement;
    cancelButton: HTMLButtonElement;
    saveButton: HTMLButtonElement;
    saveMessage: HTMLSpanElement;
} {
    const inlineEditWrapper = document.createElement('div');
    inlineEditWrapper.className = 'inline-edit-wrapper';

    const descView = document.createElement('p');
    descView.id = idPrefix + 'description-view';
    descView.className = 'inline-edit-view';
    descView.append(...htmlToNodes(formatCommentText(description || '')));
    inlineEditWrapper.append(descView);

    const editButton = document.createElement('button');
    editButton.id = idPrefix + 'edit-desc-btn';
    editButton.className = 'btn btn-success btn-sm inline-edit-btn';
    editButton.type = 'button';
    editButton.title = 'Edit description';
    const pencilIcon = document.createElement('i');
    pencilIcon.className = 'bi bi-pencil';
    editButton.append(pencilIcon);
    inlineEditWrapper.append(editButton);

    const descTextarea = document.createElement('textarea');
    descTextarea.id = idPrefix + 'description-input';
    descTextarea.rows = 4;
    descTextarea.className = 'form-control detail-textarea';
    descTextarea.setAttribute('aria-label', 'Description');
    descTextarea.classList.add('d-none');
    descTextarea.textContent = description || '';
    inlineEditWrapper.append(descTextarea);
    descTd.append(inlineEditWrapper);

    const fieldActions = document.createElement('div');
    fieldActions.className = 'field-actions';

    const cancelButton = document.createElement('button');
    cancelButton.id = idPrefix + 'cancel-desc';
    cancelButton.className = 'btn btn-outline-secondary btn-sm';
    cancelButton.type = 'button';
    cancelButton.classList.add('d-none');
    cancelButton.textContent = 'Cancel';
    fieldActions.append(cancelButton);

    const saveButton = document.createElement('button');
    saveButton.id = idPrefix + 'save-desc';
    saveButton.className = 'btn btn-primary btn-sm';
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    fieldActions.append(saveButton);

    const saveMessage = document.createElement('span');
    saveMessage.id = idPrefix + 'desc-save-msg';
    fieldActions.append(saveMessage);
    descTd.append(fieldActions);

    return { descTextarea, cancelButton, saveButton, saveMessage };
}

/**
 * Set up the description inline-edit save handler for a detail page.
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} entityId - The entity ID
 * @param {string} entityType - The entity type slug (e.g. 'epic', 'flow')
 * @param {object} entity - The entity data object (mutated in place)
 * @param {number} entity.sequenceNumber - The entity's sequence number for stack graph patching
 * @param {string} [entity.description] - The current description text
 * @param {(owner: string, project: string, id: string, desc: string) => Promise<Record<string, unknown> | undefined>} updateFunction - Async API function to persist the description.
 * @returns {void}
 */
export function setupDescriptionHandler(
    owner: string, project: string, entityId: string, entityType: string,
    entity: { sequenceNumber: number; description?: string },
    updateFunction: (owner: string, project: string, id: string, desc: string) => Promise<Record<string, unknown> | undefined>,
): void {
    const descMessage = document.querySelector('#desc-save-msg') as HTMLElement;
    const saveButton = document.querySelector('#save-desc') as HTMLButtonElement;
    if (saveButton) {
        saveButton.addEventListener('click', async (event) => {
            event.preventDefault();
            if (descMessage) descMessage.textContent = '';
            saveButton.disabled = true;
            const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
            try {
                const updated = await updateFunction(owner, project, entityId, newDesc);
                entity.description = (updated as Record<string, unknown>)?.description as string | undefined ?? (newDesc.trim() ? newDesc : undefined);
                patchDetailStackGraphNode(entityType + '-' + entity.sequenceNumber, {
                    description: entity.description,
                });
                const editor = (entity as { __editor?: { showSavedPopover?: (html: string) => void } }).__editor;
                if (editor?.showSavedPopover) editor.showSavedPopover(formatCommentText(entity.description || ''));
            } catch (error) {
                if (descMessage) descMessage.textContent = 'Save failed';
                console.error(error);
            } finally {
                saveButton.disabled = false;
            }
        });
    }
}

export {getStatusIcon, getStatusLabel, getStatusHtml} from './status-utilities.ts';

/**
 * Create a table row with a status icon and accessible label.
 * @param {string} statusColor - The status color string.
 * @returns {HTMLTableRowElement} The status table row element.
 */
export function createStatusRow(statusColor?: string): HTMLTableRowElement {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = 'Status';
    tr.append(th);
    const td = document.createElement('td');
    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = getStatusIcon(statusColor ?? '');
    td.append(iconSpan);
    const srSpan = document.createElement('span');
    srSpan.className = 'sr-only';
    srSpan.textContent = getStatusLabel(statusColor ?? '');
    td.append(srSpan);
    tr.append(td);
    return tr;
}

/**
 * Create a table row with a label and a date value.
 * @param {string} label - The row label text (e.g. 'Created', 'Updated').
 * @param {string | undefined} dateValue - The ISO date string, or undefined.
 * @returns {HTMLTableRowElement} The date table row element.
 */
export function createDateRow(label: string, dateValue?: string): HTMLTableRowElement {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = label;
    tr.append(th);
    const td = document.createElement('td');
    td.textContent = dateValue ? new Date(dateValue).toLocaleDateString('en-CA') : '\u{2013}';
    tr.append(td);
    return tr;
}