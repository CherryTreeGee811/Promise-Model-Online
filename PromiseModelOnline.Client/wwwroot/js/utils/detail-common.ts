// @ts-nocheck
import { loadComments } from '../comments/comments.ts';
import { loadReactions } from '../reactions/reactions.ts';





/**
 * Wire up the #back-link element to navigate browser history back on click.
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
 * @param {Record<string, unknown> | null} permission - User's permission object for the project.
 */
export function loadCommentsAndReactions(detailDiv: HTMLElement, entityType: string, entityId: number, owner: string, project: string, permission: Record<string, unknown> | null): void {
    const commentsContainer = document.querySelector(`#${entityType.toLowerCase()}-comments`);
    if (commentsContainer) loadComments(commentsContainer, entityType, entityId, owner, project, permission);

    let reactionsContainer = document.querySelector('#reactions-section');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.id = 'reactions-section';
    }
    if (detailDiv) {
        if (!reactionsContainer.parentNode) detailDiv.append(reactionsContainer);
        loadReactions(reactionsContainer, entityType, entityId, owner, project, permission);
    }
}

export {getStatusIcon, getStatusLabel, getStatusHtml} from './status-utilities.ts';