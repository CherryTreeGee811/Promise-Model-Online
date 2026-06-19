import { apiGet } from '../api.ts';

import { escapeHtml } from './html.ts';
import { getStatusIcon } from './status-utilities.ts';

type EntityMapEntry = { dbId?: number; statusColor?: string };

type EntityMap = Record<string, EntityMapEntry | string | null | undefined> & { _owner?: string | null; _project?: string | null };

/** @type {EntityMap} */
export const entityLookupMap: EntityMap = {};

/**
 * Fetch the entity lookup map for a comment parent and populate `entityLookupMap`.
 * @param {string} parentType - Parent entity type (e.g. "promise").
 * @param {number} parentId - Parent entity database ID.
 * @param {string} owner - Project owner slug.
 * @param {string} project - Project slug.
 */
export async function loadEntityLookupMap(parentType: string, parentId: number, owner: string, project: string): Promise<void> {
    try {
        const entities = await apiGet(`/api/comments/entity-map?parentType=${parentType}&parentId=${parentId}`);
        for (const key of Object.keys(entityLookupMap)) {
            delete entityLookupMap[key];
        }
        entityLookupMap._owner = owner ?? undefined;
        entityLookupMap._project = project ?? undefined;
        if (Array.isArray(entities)) {
            for (const entity of entities) {
                entityLookupMap[`${entity.entityType}-${entity.sequenceNumber}`] = {
                    dbId: entity.id,
                    statusColor: entity.statusColor,
                };
            }
        }
    } catch {
        // silent
    }
}

/**
 * Convert entity references (#promise-123) and \@mentions in comment text
 * to anchor links using the current entityLookupMap.
 * @param {string} text - Raw comment text.
 * @returns {string} HTML-formatted comment string.
 */
export function formatCommentText(text: string): string {
    let html = escapeHtml(text);
    html = html.replaceAll(/#(promise|epic|journey|flow|moment)-(\d+)/g, (match, type: string, number_: string) => {
        const key = `${type}-${number_}`;
        const entry = entityLookupMap[key] as EntityMapEntry | undefined;
        const owner = entityLookupMap._owner as string | undefined;
        const project = entityLookupMap._project as string | undefined;
        const route = `${type}s`;
        if (entry !== undefined) {
            const emoji = getStatusIcon(entry.statusColor ?? '');
            if (owner && project) {
                return `<a href="/${owner}/${project}/${route}/${number_}" class="promise-ref">${match} ${emoji}</a>`;
            }
            return `<a href="/${route}/${entry.dbId}" class="promise-ref">${match} ${emoji}</a>`;
        }
        if (owner && project) {
            return `<a href="/${owner}/${project}/${route}/${number_}" class="promise-ref promise-ref--legacy">${match}</a>`;
        }
        return `<a href="/${route}/${number_}" class="promise-ref promise-ref--legacy">${match}</a>`;
    });
    html = html.replaceAll(/@(\w+)/g, '<span class="mention">@$1</span>');
    return html;
}
