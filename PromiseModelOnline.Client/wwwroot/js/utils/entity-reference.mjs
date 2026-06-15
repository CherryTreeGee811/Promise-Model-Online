import { apiGet } from '../api.mjs';
import { escapeHtml } from './html.mjs';

/** Global entity lookup map keyed by "type-seqNumber". */
export const entityLookupMap = {};

/**
 * Load the entity lookup map for comment auto-linking within a project scope.
 * @param {string} parentType - The parent entity type.
 * @param {number} parentId - The parent entity ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
export async function loadEntityLookupMap(parentType, parentId, owner, project) {
    try {
        const entities = await apiGet(`/api/comments/entity-map?parentType=${parentType}&parentId=${parentId}`);
        Object.keys(entityLookupMap).forEach(k => delete entityLookupMap[k]);
        entityLookupMap._owner = owner ?? null;
        entityLookupMap._project = project ?? null;
        if (Array.isArray(entities)) {
            for (const e of entities) {
                entityLookupMap[`${e.entityType}-${e.sequenceNumber}`] = {
                    dbId: e.id,
                    statusColor: e.statusColor,
                };
            }
        }
    } catch {
        // silent
    }
}

/**
 * Get the status emoji for a status color string.
 * @param {string} statusColor - The status color.
 * @returns {string} The emoji character.
 */
function statusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '\u{1F7E2}';
    if (normalized.includes('black') || normalized.includes('blocked')) return '\u{26AB}\uFE0F';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '\u{1F7E0}';
    if (normalized.includes('red') || normalized.includes('todo')) return '\u{1F534}';
    return '\u26AA';
}

/**
 * Format comment text: replace #type-seq references with links and @mentions with styled spans.
 * @param {string} text - The raw comment text.
 * @returns {string} The formatted HTML.
 */
export function formatCommentText(text) {
    let html = escapeHtml(text);
    html = html.replace(/#(promise|epic|journey|flow|moment)-(\d+)/g, (match, type, num) => {
        const key = `${type}-${num}`;
        const entry = entityLookupMap[key];
        const owner = entityLookupMap._owner;
        const project = entityLookupMap._project;
        const route = `${type}s`;
        if (entry != null) {
            const emoji = statusIcon(entry.statusColor);
            if (owner && project) {
                return `<a href="/${owner}/${project}/${route}/${num}" class="promise-ref">${match} ${emoji}</a>`;
            }
            return `<a href="/${route}/${entry.dbId}" class="promise-ref">${match} ${emoji}</a>`;
        }
        if (owner && project) {
            return `<a href="/${owner}/${project}/${route}/${num}" class="promise-ref promise-ref--legacy">${match}</a>`;
        }
        return `<a href="/${route}/${num}" class="promise-ref promise-ref--legacy">${match}</a>`;
    });
    html = html.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return html;
}
