import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';

export function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '\u{1F7E2}';
    if (normalized.includes('black') || normalized.includes('blocked')) return '\u{26AB}\uFE0F';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '\u{1F7E0}';
    if (normalized.includes('red') || normalized.includes('todo')) return '\u{1F534}';
    return '\u26AA';
}

export function getStatusLabel(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return 'Done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'Blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'In Progress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'Todo';
    return 'Unknown';
}

export function getStatusHtml(statusColor) {
    return `<span aria-hidden="true">${getStatusIcon(statusColor)}</span><span class="sr-only">${getStatusLabel(statusColor)}</span>`;
}

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
