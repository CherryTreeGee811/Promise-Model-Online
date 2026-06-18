// @ts-nocheck
import { getUsername } from '../auth-state.ts';

import { getReactions, addReaction, updateReaction } from './api.ts';

const EMOTE_SET = ['👍', '👎', '❤️', '😀', '🎉', '🚀', '👀'];

/** @typedef {{ counts: Record<string, number>, myReactionId: number|null, myEmote: string|null }} ReactionsState */

/**
 * Load and render the reactions section for an entity.
 * @param {HTMLElement} container - The container element to render reactions into.
 * @param {string} parentType - The parent entity type.
 * @param {number} parentId - The parent entity ID.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @param {{ permission?: string }} permission - The user's permission object.
 */
export function loadReactions(container, parentType, parentId, owner, project, permission) {
    const canReact = permission?.permission === 'Comment' || permission?.permission === 'Edit';

    container.innerHTML = `
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            ${canReact ? `<span class="reactions-picker">
                ${EMOTE_SET.map(emote => `<button class="btn btn-outline-secondary btn-sm emote-btn" data-emote="${emote}" title="${emote}" aria-label="React with ${emote}">${emote}</button>`).join('')}
            </span>` : ''}
        </div>
    `;

    const summaryElement = /** @type {HTMLElement} */ (container.querySelector('#reactions-summary'));
    const buttons = container.querySelectorAll('.emote-btn');
    const myUsername = getUsername();

    /** @type {ReactionsState} */
    const state = {
        counts: {},
        myReactionId: undefined,
        myEmote: undefined,
    };

    /** Render the reaction counts summary into the summary element. */
    function renderSummary() {
        const items = EMOTE_SET
            .filter(emote => state.counts[emote])
            .map(emote => `${emote} ${state.counts[emote]}`);
        summaryElement.textContent = items.join(' ') || 'No reactions yet.';
    }

    /** Fetch the latest reactions from the API and update the summary. */
    async function refresh() {
        try {
            const reactions = await getReactions(owner, project, parentType, parentId);
            state.counts = {};
            const reactionList = reactions || [];
            for (const reaction of reactionList) {
                state.counts[reaction.emote] = (state.counts[reaction.emote] || 0) + 1;
            }

            if (myUsername) {
                const mine = (reactions || []).find(r => String(r.userName) === String(myUsername));
                state.myReactionId = mine?.id ?? undefined;
                state.myEmote = mine?.emote ?? undefined;
            }

            renderSummary();
        } catch {
            summaryElement.textContent = 'Failed to load reactions.';
        }
    }

    void refresh();

    for (const button of buttons) {
        button.addEventListener('click', async () => {
            const emote = button.dataset.emote;
            try {
                const y = window.scrollY;
                const updated = state.myReactionId
                    ? await updateReaction(owner, project, state.myReactionId, emote)
                    : await addReaction(owner, project, { parentType, parentId, emote });

                const previous = state.myEmote;
                const next = updated?.emote ?? emote;

                if (previous && previous !== next) {
                    state.counts[previous] = Math.max(0, (state.counts[previous] || 0) - 1);
                }
                if (!previous || previous !== next) {
                    state.counts[next] = (state.counts[next] || 0) + 1;
                }

                state.myReactionId = updated?.id ?? state.myReactionId;
                state.myEmote = next;
                renderSummary();
                window.scrollTo(0, y);
            } catch {
                alert('Failed to react');
            }
        });
    }
}
