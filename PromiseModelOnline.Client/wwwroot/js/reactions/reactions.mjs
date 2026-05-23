import { getReactions, createReaction, updateReaction, deleteReaction } from './api.mjs';
import { getNameFromToken } from '../parser.mjs';
import { getAccessToken } from '../auth-state.mjs';

const EMOTE_SET = ['👍', '👎', '❤️', '😀', '🎉', '🚀', '👀'];

export function loadReactions(container, parentType, parentId) {
    container.innerHTML = `
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            <span class="reactions-picker">
                ${EMOTE_SET.map(e => `<button class="emote-btn" data-emote="${e}" title="${e}">${e}</button>`).join('')}
            </span>
        </div>
    `;

    const summaryEl = container.querySelector('#reactions-summary');
    const buttons = container.querySelectorAll('.emote-btn');

    const token = getAccessToken();
    const myUserName = getNameFromToken(token);

    const state = {
        counts: {},
        myReactionId: null,
        myEmote: null,
    };

    function renderSummary() {
        const items = EMOTE_SET
            .filter(e => state.counts[e])
            .map(e => `${e} ${state.counts[e]}`);
        summaryEl.textContent = items.join(' ') || 'No reactions yet.';
    }

    async function refresh() {
        try {
            const reactions = await getReactions(parentType, parentId);
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
                    ? await updateReaction(state.myReactionId, emote)
                    : await createReaction(parentType, parentId, emote);

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