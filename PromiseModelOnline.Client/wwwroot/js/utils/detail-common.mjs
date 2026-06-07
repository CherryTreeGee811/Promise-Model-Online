import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';
import { getStatusIcon, getStatusLabel, getStatusHtml } from './status-utils.mjs';
export { getStatusIcon, getStatusLabel, getStatusHtml };

export function initBackLink() {
    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', () => window.history.back());
    }
}

export function loadCommentsAndReactions(detailDiv, entityType, entityId) {
    const commentsContainer = document.getElementById(`${entityType.toLowerCase()}-comments`);
    if (commentsContainer) loadComments(commentsContainer, entityType, entityId);

    let reactionsContainer = document.getElementById('reactions-section');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.id = 'reactions-section';
    }
    if (detailDiv) {
        if (!reactionsContainer.parentNode) detailDiv.appendChild(reactionsContainer);
        loadReactions(reactionsContainer, entityType, entityId);
    }
}
