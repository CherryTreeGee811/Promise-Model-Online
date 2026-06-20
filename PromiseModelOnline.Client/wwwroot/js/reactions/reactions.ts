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
 * @param {string} [permission.permission] - The user's permission level (Comment, Edit, Owner).
 */
export function loadReactions(container: HTMLElement, parentType: string, parentId: string, owner: string, project: string, permission: { permission?: string }): void {
    const canReact = permission?.permission === 'Comment' || permission?.permission === 'Edit';

    container.replaceChildren();

    const barDiv = document.createElement('div');
    barDiv.className = 'reactions-bar';

    const summarySpan = document.createElement('span');
    summarySpan.className = 'reactions-summary';
    summarySpan.id = 'reactions-summary';
    barDiv.append(summarySpan);

    if (canReact) {
        const pickerSpan = document.createElement('span');
        pickerSpan.className = 'reactions-picker';
        for (const emote of EMOTE_SET) {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-secondary btn-sm emote-btn';
            button.dataset.emote = emote;
            button.title = emote;
            button.setAttribute('aria-label', `React with ${emote}`);
            button.textContent = emote;
            pickerSpan.append(button);
        }
        barDiv.append(pickerSpan);
    }

    container.append(barDiv);

    const summaryElement = container.querySelector('#reactions-summary') as HTMLElement | null;
    const buttons = container.querySelectorAll('.emote-btn');
    const myUsername = getUsername();

    const state: {
        counts: Record<string, number>;
        myReactionId: number | undefined;
        myEmote: string | undefined;
    } = {
        counts: {},
        myReactionId: undefined,
        myEmote: undefined,
    };

    /** Render the reaction counts summary into the summary element. */
    function renderSummary() {
        const items = EMOTE_SET
            .filter(emote => state.counts[emote])
            .map(emote => `${emote} ${state.counts[emote]}`);
        if (summaryElement) summaryElement.textContent = items.join(' ') || 'No reactions yet.';
    }

    /** Fetch the latest reactions from the API and update the summary. */
    async function refresh() {
        try {
            const reactions = await getReactions(owner, project, parentType, parentId) as Record<string, unknown>[];
            state.counts = {};
            const reactionList = reactions || [];
            for (const reaction of reactionList) {
                state.counts[reaction.emote as string] = (state.counts[reaction.emote as string] || 0) + 1;
            }

            if (myUsername) {
                const mine = (reactions || []).find(r => String(r.userName) === String(myUsername));
                state.myReactionId = (mine as Record<string, unknown>)?.id as number ?? undefined;
                state.myEmote = (mine as Record<string, unknown>)?.emote as string ?? undefined;
            }

            renderSummary();
        } catch {
            if (summaryElement) summaryElement.textContent = 'Failed to load reactions.';
        }
    }

    void refresh();

    for (const button of buttons) {
        button.addEventListener('click', async () => {
            const emote = (button as HTMLElement).dataset.emote;
            try {
                const y = window.scrollY;
                const updated = (state.myReactionId
                    ? await updateReaction(owner, project, state.myReactionId, emote)
                    : await addReaction(owner, project, { parentType, parentId, emote })) as Record<string, unknown> | null;

                const previous = state.myEmote;
                const next = (updated?.emote as string) ?? emote;

                if (previous && previous !== next) {
                    state.counts[previous] = Math.max(0, (state.counts[previous] || 0) - 1);
                }
                if (!previous || previous !== next) {
                    state.counts[next] = (state.counts[next] || 0) + 1;
                }

                state.myReactionId = (updated?.id as number) ?? state.myReactionId;
                state.myEmote = next;
                renderSummary();
                window.scrollTo(0, y);
            } catch {
                alert('Failed to react');
            }
        });
    }
}
