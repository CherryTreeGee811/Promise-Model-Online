import { authFetch, apiGet } from '../api.ts';

/**
 * Fetch all projects visible to the authenticated user.
 * @returns {Promise<Record<string, unknown>[]|undefined>} The list of projects, or undefined if none.
 */
export async function fetchProjects() {
    return handleJsonOrNull(await authFetch(`/api/projects`));
}

/**
 * Create a new project with the provided data.
 * @param {Record<string, unknown>} data - The project creation payload (name, description, etc.).
 * @returns {Promise<Record<string, unknown>|undefined>} The created project, or undefined if 204.
 */
export async function createProject(data: Record<string, unknown>) {
    const response = await authFetch(`/api/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.status === 204) return;
    if (!response.ok) {
        const body = await safeParse(response);
        throw new Error(body?.message || body?.title || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Update a project's name and/or description via PATCH.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {Record<string, unknown>} data - The fields to update (name, description).
 * @returns {Promise<Record<string, unknown>>} The updated project.
 */
export async function updateProjectDetails(owner: string, project: string, data: Record<string, unknown>) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const body = await safeParse(response);
        throw new Error(body?.message || body?.title || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Delete the entire project and all associated data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<void|undefined>} Resolves when deletion is complete.
 */
export async function deleteProject(owner: string, project: string) {
    return handleJsonOrNull(await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`, {
        method: 'DELETE'
    }));
}

/**
 * Get a single project by owner and slug.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Record<string, unknown>|undefined>} The project data, or undefined if 204.
 */
export async function getProject(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`);

    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
}

/**
 * Export the project as a downloadable JSON blob.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Blob>} The exported project as a binary blob.
 */
export async function exportProject(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/export`);

    if (!response.ok) {
        const body = await safeParse(response);
        throw new Error(body?.message || body?.title || `HTTP ${response.status}`);
    }

    return response.blob();
}

/**
 * Fetch paginated audit events for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number} [take] - Number of events per page (default 10).
 * @param {number} [skip] - Number of events to skip for pagination (default 0).
 * @returns {Promise<{items: Record<string, unknown>[], totalCount: number}>} Paginated audit results.
 */
export async function getAuditEvents(owner: string, project: string, take: number = 10, skip: number = 0) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/audit-events?take=${take}&skip=${skip}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const items = await response.json();
    const totalCount = Number(response.headers.get('X-Total-Count') || String(items.length));

    return { items, totalCount: Number.isNaN(totalCount) ? items.length : totalCount };
}

/**
 * Import a project from an uploaded JSON file.
 * @param {File} file - The JSON export file to import.
 * @returns {Promise<Record<string, unknown>>} The imported project data.
 */
export async function importProject(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await authFetch(`/api/projects/import`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const body = await safeParse(response);
        const message = body?.message
            || body?.title
            || (Array.isArray(body?.errors) ? body.errors.join(' ') : '')
            || `HTTP ${response.status}`;

        throw new Error(message);
    }

    return response.json();
}

/**
 * Get all permission assignments for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Record<string, unknown>[]>} The list of permissions.
 */
export async function getPermissions(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Invite a user to a project with a specific permission level.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {Record<string, unknown>} data - The invitation payload (email, level).
 * @returns {Promise<Record<string, unknown>>} The created permission record.
 */
export async function inviteUser(owner: string, project: string, data: Record<string, unknown>) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Search for users by name or email (autocomplete).
 * @param {string} query - The search query string.
 * @returns {Promise<Record<string, unknown>[]>} Matching user records.
 */
export async function searchUsers(query: string) {
    const parameters = new URLSearchParams({ q: query, max: '10' });
    return apiGet(`/api/users/search?${parameters}`);
}

/**
 * Remove a user's permission from a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string|number} permissionId - The permission record ID to remove.
 * @returns {Promise<void>} Resolves when the permission is removed.
 */
export async function removePermission(owner: string, project: string, permissionId: string | number) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions/${permissionId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}


/**
 * Fetch the full graph data (nodes and links) for the project hierarchy.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Record<string, unknown>|undefined>} The graph data, or undefined if 204.
 */
export async function getGraphData(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/graph`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}


/**
 * Get the calling user's permission record for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Record<string, unknown>|undefined>} The permission record, or undefined if 204.
 */
export async function getMyPermission(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Safely parses a response as JSON, returning undefined for 204 No Content responses.
 * @param {Response} response - The fetch Response object.
 * @returns {Promise<unknown> | Promise<void>} The parsed JSON body, or undefined for 204 responses.
 * @throws {Error} If the response status is not OK.
 */
function handleJsonOrNull(response: Response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return Promise.resolve();
    return response.json();
}

/**
 * Tries to parse a response as JSON, returning undefined on failure.
 * @param {Response} response - The fetch Response object.
 * @returns {Promise<unknown | undefined>} The parsed JSON body, or undefined if parsing fails.
 */
async function safeParse(response: Response) {
    try {
        return await response.json();
    } catch {
        return;
    }
}
