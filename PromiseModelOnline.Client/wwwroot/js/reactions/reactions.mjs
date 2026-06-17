import { getReactions, addReaction, updateReaction } from './api.ts';
import { getCurrentUserName } from '../parser.mjs';

const EMOTE_SET = ['👍', '👎', '❤️', '😀', '🎉', '🚀', '👀'];

/**
 * Load and render the reactions section for an entity.
 * @param {HTMLElement} container - The container element to render reactions into.
 * @param {string} parentType - The parent entity type.
 * @param {number} parentId - The parent entity ID.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @param {Object} permission - The user's permission object.
 * @returns {void}
 */
export function loadReactions(container, parentType, parentId, owner, project, permission) {
    const canReact = permission?.permission === 'Comment' || permission?.permission === 'Edit';

    container.innerHTML = `
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            ${canReact ? `<span class="reactions-picker">
                ${EMOTE_SET.map(e => `<button class="btn btn-outline-secondary btn-sm emote-btn" data-emote="${e}" title="${e}" aria-label="React with ${e}">${e}</button>`).join('')}
            </span>` : ''}
        </div>
    `;

    const summaryEl = container.querySelector('#reactions-summary');
    const buttons = container.querySelectorAll('.emote-btn');

    const myUserName = getCurrentUserName();

    const state = {
        counts: {},
        myReactionId: null,
        myEmote: null,
    };

    /**
     * Render the reaction counts summary into the summary element.
     * @returns {void}
     */
    function renderSummary() {
        const items = EMOTE_SET
            .filter(e => state.counts[e])
            .map(e => `${e} ${state.counts[e]}`);
        summaryEl.textContent = items.join(' ') || 'No reactions yet.';
    }

    /**
     * Fetch the latest reactions from the API and update the summary.
     * @returns {Promise<void>}
     */
    async function refresh() {
        try {
            const reactions = await getReactions(owner, project, parentType, parentId);
            state.counts = {};
            (reactions || []).forEach(r => {
                state.counts[r.emote] = (state.counts[r.emote] || 0) + 1;
            });

            if (myUserName) {
                const mine = (reactions || []).find(r => String(r.userName) === String(myUserName));
                state.myReactionId = mine?.id ?? null;
                state.myEmote = mine?.emote ?? null;
            }

            renderSummary();
        } catch (err) {
            summaryEl.textContent = 'Failed to load reactions.';
        }
    }

    refresh();

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const emote = btn.dataset.emote;
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
            } catch (err) {
                alert('Failed to react');
            }
        });
    });
}
