import { getReactions, upsertReaction, deleteReaction } from './api.mjs';

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

    async function refresh() {
        try {
            const reactions = await getReactions(parentType, parentId);
            const counts = {};
            reactions.forEach(r => counts[r.emote] = (counts[r.emote] || 0) + 1);
            const items = EMOTE_SET.filter(e => counts[e]).map(e => `${e} ${counts[e]}`);
            summaryEl.textContent = items.join(' ') || 'No reactions yet.';
        } catch (err) {
            summaryEl.textContent = 'Failed to load reactions.';
        }
    }

    refresh();

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const emote = btn.dataset.emote;
            try {
                await upsertReaction(parentType, parentId, emote);
                refresh();
            } catch (err) {
                alert('Failed to react');
            }
        });
    });
}