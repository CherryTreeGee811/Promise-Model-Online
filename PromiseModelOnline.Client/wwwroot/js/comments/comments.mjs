import { getComments, postComment } from './api.mjs';

export function loadComments(container, parentType, parentId) {
    container.innerHTML = `
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list" role="list" aria-label="Comments"></div>
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" rows="3" required placeholder="Write a comment... Use @name to mention someone."></textarea>
            <button type="submit" class="view-btn">Post</button>
        </form>
    `;

    const commentsList = container.querySelector('#comments-list');
    const form = container.querySelector('#comment-form');
    const textarea = container.querySelector('#comment-textarea');

    getComments(parentType, parentId)
        .then(comments => renderComments(commentsList, comments))
        .catch(err => {
            commentsList.innerHTML = '<p class="error">Failed to load comments.</p>';
            console.error(err);
        });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = textarea.value.trim();
        if (!text) return;
        try {
            await postComment(parentType, parentId, text);
            const updated = await getComments(parentType, parentId);
            renderComments(commentsList, updated);
            textarea.value = '';
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
    comments.forEach(comment => {
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
        container.appendChild(div);
    });
}

function formatCommentText(text) {
    return escapeHtml(text).replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}