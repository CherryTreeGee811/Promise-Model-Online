import { getComments, addComment } from './api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';
import { createCommentAutocomplete } from './autocomplete.mjs';
import { loadEntityLookupMap, formatCommentText } from '../utils/entity-reference.mjs';
import { isAtLeast } from '../utils/permissions.mjs';

export function loadComments(container, parentType, parentId, owner, project, permission) {
    const canComment = isAtLeast(permission?.permission, 'Comment');

    container.innerHTML = `
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list"></div>
        ${canComment ? `
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" class="form-control mb-2" rows="3" required placeholder="Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment."></textarea>
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>` : ''}
    `;

    const commentsList = container.querySelector('#comments-list');
    const form = container.querySelector('#comment-form');
    const textarea = container.querySelector('#comment-textarea');

    if (textarea) {
        createCommentAutocomplete(textarea, parentType, parentId);
    }

    // Fetch entity map for reference resolution and comments in parallel
    const mapPromise = loadEntityLookupMap(parentType, parentId, owner, project);

    Promise.all([
        getComments(owner, project, parentType, parentId),
        mapPromise,
    ])
        .then(([comments]) => renderComments(commentsList, comments, canComment))
        .catch(() => {
            commentsList.removeAttribute('role');
            commentsList.removeAttribute('aria-label');
            commentsList.innerHTML = '<p class="error">Failed to load comments.</p>';
        });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = textarea.value.trim();
            if (!text) return;
            try {
                const y = window.scrollY;
                const created = await addComment(owner, project, { parentType, parentId, text });
                appendComment(commentsList, created);
                textarea.value = '';
                window.scrollTo(0, y);
            } catch (err) {
                alert('Failed to post comment.');
                console.error(err);
            }
        });
    }
}

function renderComments(container, comments, canComment) {
    container.innerHTML = '';
    if (!comments || comments.length === 0) {
        container.innerHTML = renderEmptyStateSection({
            icon: 'bi-chat-dots',
            title: 'No comments yet.',
            description: canComment ? 'Be the first to share your thoughts.' : '',
        });
        return;
    }
    comments.forEach(comment => container.appendChild(createCommentElement(comment)));
}

function appendComment(container, comment) {
    // Remove empty state without re-rendering the entire list.
    const empty = container.querySelector('.no-items');
    if (empty) empty.remove();
    container.appendChild(createCommentElement(comment));
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    const userName = comment.userName || comment.authorName || 'Unknown';
    div.innerHTML = `
        <div class="comment-meta">
            <strong>${escapeHtml(userName)}</strong> – ${new Date(comment.createdAt).toLocaleString('en-CA')}
        </div>
        <div class="comment-text">${formatCommentText(comment.text)}</div>
        ${comment.mentionedUsers && comment.mentionedUsers.length ? `<div class="comment-mentions">Mentions: ${comment.mentionedUsers.join(', ')}</div>` : ''}
        ${comment.replies && comment.replies.length ? `<div class="comment-replies">${comment.replies.map(r => `
            <div class="comment-item reply">
                <strong>${escapeHtml(r.userName || r.authorName || 'Unknown')}</strong>: ${escapeHtml(r.text)}
            </div>
        `).join('')}</div>` : ''}
    `;
    return div;
}

