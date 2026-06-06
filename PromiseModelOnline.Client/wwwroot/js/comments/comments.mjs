import { getComments, postComment } from './api.mjs';
import { apiGet } from '../api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { createCommentAutocomplete } from './autocomplete.mjs';

const entityLookupMap = {};

export function loadComments(container, parentType, parentId) {
    container.innerHTML = `
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list"></div>
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" class="form-control mb-2" rows="3" required placeholder="Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment."></textarea>
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>
    `;

    const commentsList = container.querySelector('#comments-list');
    const form = container.querySelector('#comment-form');
    const textarea = container.querySelector('#comment-textarea');

    const autocomplete = createCommentAutocomplete(textarea, parentType, parentId);

    // Fetch entity map for reference resolution and comments in parallel
    const mapPromise = apiGet(`/api/comments/entity-map?parentType=${parentType}&parentId=${parentId}`)
        .then(entities => {
            Object.keys(entityLookupMap).forEach(k => delete entityLookupMap[k]);
            if (Array.isArray(entities)) {
                for (const e of entities) {
                    entityLookupMap[`${e.entityType}-${e.sequenceNumber}`] = e.id;
                }
            }
        })
        .catch(() => {});

    Promise.all([
        getComments(parentType, parentId),
        mapPromise,
    ])
        .then(([comments]) => renderComments(commentsList, comments))
        .catch(() => {
            commentsList.removeAttribute('role');
            commentsList.removeAttribute('aria-label');
            commentsList.innerHTML = '<p class="error">Failed to load comments.</p>';
        });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = textarea.value.trim();
        if (!text) return;
        try {
            const y = window.scrollY;
            const created = await postComment(parentType, parentId, text);
            appendComment(commentsList, created);
            textarea.value = '';
            window.scrollTo(0, y);
        } catch (err) {
            alert('Failed to post comment.');
            console.error(err);
        }
    });
}

function renderComments(container, comments) {
    container.innerHTML = '';
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p class="no-items">No comments yet.</p>';
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
    div.innerHTML = `
        <div class="comment-meta">
            <strong>${escapeHtml(comment.userName)}</strong> – ${new Date(comment.createdAt).toLocaleString('en-CA')}
        </div>
        <div class="comment-text">${formatCommentText(comment.text)}</div>
        ${comment.mentionedUsers && comment.mentionedUsers.length ? `<div class="comment-mentions">Mentions: ${comment.mentionedUsers.join(', ')}</div>` : ''}
        ${comment.replies && comment.replies.length ? `<div class="comment-replies">${comment.replies.map(r => `
            <div class="comment-item reply">
                <strong>${escapeHtml(r.userName)}</strong>: ${escapeHtml(r.text)}
            </div>
        `).join('')}</div>` : ''}
    `;
    return div;
}

function formatCommentText(text) {
    let html = escapeHtml(text);
    html = html.replace(/#(promise|epic|journey|flow|moment)-(\d+)/g, (match, type, num) => {
        const key = `${type}-${num}`;
        const dbId = entityLookupMap[key];
        if (dbId != null) {
            return `<a href="/${type}s/${dbId}" class="promise-ref">${match}</a>`;
        }
        return `<a href="/${type}s/${num}" class="promise-ref promise-ref--legacy">${match}</a>`;
    });
    html = html.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return html;
}