// @ts-nocheck
import { loadComments } from '../comments/comments.ts';
import { loadReactions } from '../reactions/reactions.ts';
import { getStatusIcon, getStatusLabel, getStatusHtml } from './status-utils.ts';
export { getStatusIcon, getStatusLabel, getStatusHtml };

/**
 * Wire up the #back-link element to navigate browser history back on click.
 */
export function initBackLink(): void {
    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', () => window.history.back());
    }
}

/**
 * Load the comments list and reactions section for a detail page.
 * @param detailDiv - The main detail container element.
 * @param entityType - Entity type (e.g. "promise", "epic").
 * @param entityId - Numeric entity database ID.
 * @param owner - Project owner slug.
 * @param project - Project slug.
 * @param permission - User's permission object for the project.
 */
export function loadCommentsAndReactions(detailDiv: HTMLElement, entityType: string, entityId: number, owner: string, project: string, permission: Record<string, unknown> | null): void {
    const commentsContainer = document.getElementById(`${entityType.toLowerCase()}-comments`);
    if (commentsContainer) loadComments(commentsContainer, entityType, entityId, owner, project, permission);

    let reactionsContainer = document.getElementById('reactions-section');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.id = 'reactions-section';
    }
    if (detailDiv) {
        if (!reactionsContainer.parentNode) detailDiv.appendChild(reactionsContainer);
        loadReactions(reactionsContainer, entityType, entityId, owner, project, permission);
    }
}
