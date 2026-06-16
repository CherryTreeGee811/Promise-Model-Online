import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';
import { getStatusIcon, getStatusLabel, getStatusHtml } from './status-utils.mjs';
export { getStatusIcon, getStatusLabel, getStatusHtml };

/**
 * Bind the back-link button to navigate backward in history.
 * @returns {void}
 */
export function initBackLink() {
    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', () => window.history.back());
    }
}

/**
 * Load comments and reaction widgets for an entity detail page.
 * @param {HTMLElement} detailDiv - The detail page container.
 * @param {string} entityType - The entity type (e.g., "moment", "flow").
 * @param {number} entityId - The entity's primary key.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object|null} permission - The user's permission object.
 */
export function loadCommentsAndReactions(detailDiv, entityType, entityId, owner, project, permission) {
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
