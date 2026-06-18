import { loadEntityLookupMap, formatCommentText } from '../utils/entity-reference.ts';
import { isAtLeast } from '../utils/permissions.ts';

import { getComments, addComment } from './api.ts';
import { createCommentAutocomplete } from './autocomplete.ts';

/**
 * @param {string} html - HTML string to parse
 * @returns {Node[]} Array of child nodes
 */
function htmlToNodes(html) {
    const document_ = new DOMParser().parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    fragment.append(...document_.body.childNodes);
    return [...fragment.childNodes];
}

/**
 * @param {HTMLElement} container - The container element
 * @param {string} parentType - The parent entity type
 * @param {number} parentId - The parent entity ID
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {Record<string, unknown>} [permission] - Permission object
 */
export async function loadComments(container: HTMLElement, parentType: string, parentId: number, owner: string, project: string, permission?: Record<string, unknown>): Promise<void> {
    const canComment = isAtLeast(permission?.permission as string, 'Comment');

    container.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Comments';
    container.append(heading);

    const commentsList = document.createElement('div');
    commentsList.id = 'comments-list';
    commentsList.className = 'comments-list';
    container.append(commentsList);

    if (canComment) {
        const form = document.createElement('form');
        form.id = 'comment-form';
        form.className = 'comment-form';
        form.setAttribute('aria-label', 'Add a comment');

        const label = document.createElement('label');
        label.htmlFor = 'comment-textarea';
        label.className = 'sr-only';
        label.textContent = 'Your comment';
        form.append(label);

        const textarea = document.createElement('textarea');
        textarea.id = 'comment-textarea';
        textarea.className = 'form-control mb-2';
        textarea.rows = 3;
        textarea.required = true;
        textarea.placeholder = 'Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment.';
        form.append(textarea);

        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'btn btn-primary btn-sm';
        button.textContent = 'Post';
        form.append(button);

        container.append(form);
    }

    const mapPromise = loadEntityLookupMap(parentType, parentId, owner, project);

    try {
        const [comments] = await Promise.all([
            getComments(owner, project, parentType, parentId),
            mapPromise,
        ]);
        renderComments(commentsList, comments as any[], canComment);
    } catch {
        commentsList.replaceChildren();
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = 'Failed to load comments.';
        commentsList.append(p);
    }

    if (canComment) {
        const form = container.querySelector('#comment-form') as HTMLFormElement;
        const textarea = container.querySelector('#comment-textarea') as HTMLTextAreaElement;

        if (textarea) {
            createCommentAutocomplete(textarea, parentType, parentId);
        }

        if (form && textarea) {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const text = textarea.value.trim();
                if (!text) return;
                try {
                    const y = window.scrollY;
                    const created = await addComment(owner, project, { parentType, parentId, text });
                    appendComment(commentsList, created as Record<string, unknown>);
                    textarea.value = '';
                    window.scrollTo(0, y);
                } catch (error) {
                    alert('Failed to post comment.');
                    console.error(error);
                }
            });
        }
    }
}

/**
 * @param {HTMLElement} container - The container element
 * @param {Record<string, unknown>[]} comments - Array of comments
 * @param {boolean} canComment - Whether user can comment
 */
function renderComments(container: HTMLElement, comments: Record<string, unknown>[], canComment: boolean): void {
    container.replaceChildren();
    if (!comments || comments.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'no-items d-flex flex-column align-items-center gap-3 py-5';
        const iconDiv = document.createElement('div');
        iconDiv.className = 'empty-table-icon';
        const icon = document.createElement('i');
        icon.className = 'bi bi-chat-dots';
        iconDiv.append(icon);
        emptyDiv.append(iconDiv);
        const title = document.createElement('h5');
        title.className = 'fw-semibold text-secondary mb-1';
        title.textContent = 'No comments yet.';
        emptyDiv.append(title);
        if (canComment) {
            const desc = document.createElement('p');
            desc.className = 'text-muted mb-2';
            desc.textContent = 'Be the first to share your thoughts.';
            emptyDiv.append(desc);
        }
        container.append(emptyDiv);
        return;
    }
    const fragment = document.createDocumentFragment();
    for (const comment of comments) { fragment.append(createCommentElement(comment)); }
    container.append(fragment);
}

/**
 * @param {HTMLElement} container - The container element
 * @param {Record<string, unknown>} comment - Comment to append
 */
function appendComment(container: HTMLElement, comment: Record<string, unknown>): void {
    const empty = container.querySelector('.no-items');
    if (empty) empty.remove();
    container.append(createCommentElement(comment));
}

/**
 * @param {Record<string, unknown>} comment - Comment data
 * @returns {HTMLElement} The comment element
 */
function createCommentElement(comment: Record<string, unknown>): HTMLElement {
    const div = document.createElement('div');
    div.className = 'comment-item';
    const username = (comment.userName as string) || (comment.authorName as string) || 'Unknown';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const strong = document.createElement('strong');
    strong.textContent = username;
    meta.append(strong, ` \u{2013} ${new Date(comment.createdAt as string).toLocaleString('en-CA')}`);
    div.append(meta);

    const textDiv = document.createElement('div');
    textDiv.className = 'comment-text';
    textDiv.append(...htmlToNodes(formatCommentText(comment.text as string)));
    div.append(textDiv);

    if ((comment.mentionedUsers as Record<string, unknown>[] | undefined)?.length) {
        const mentions = document.createElement('div');
        mentions.className = 'comment-mentions';
        mentions.textContent = `Mentions: ${(comment.mentionedUsers as string[]).join(', ')}`;
        div.append(mentions);
    }

    if ((comment.replies as Record<string, unknown>[] | undefined)?.length) {
        const repliesDiv = document.createElement('div');
        repliesDiv.className = 'comment-replies';
        for (const r of (comment.replies as Record<string, unknown>[])) {
            const reply = document.createElement('div');
            reply.className = 'comment-item reply';
            const replyStrong = document.createElement('strong');
            replyStrong.textContent = (r.userName as string) || (r.authorName as string) || 'Unknown';
            reply.append(replyStrong, `: ${(r.text as string)}`);
            repliesDiv.append(reply);
        }
        div.append(repliesDiv);
    }

    return div;
}
