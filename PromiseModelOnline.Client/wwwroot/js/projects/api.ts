import { authFetch, apiGet } from '../api.ts';

/**
 * Fetch all projects accessible to the current user.
 * @returns {Promise<object[]|null>} The list of projects, or null if none.
 */
export async function fetchProjects() {
    return handleJsonOrNull(await authFetch(`/api/projects`));
}

/**
 * Create a new project.
 * @param {object} data - The project creation data.
 * @returns {Promise<object|null>} The created project, or null.
 */
export async function createProject(data) {
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
 * Update a project's name and description.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The update data.
 * @returns {Promise<object>} The updated project.
 */
export async function updateProjectDetails(owner, project, data) {
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
 * Delete a project by owner and project slug.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The deletion result, or null.
 */
export async function deleteProject(owner, project) {
    return handleJsonOrNull(await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`, {
        method: 'DELETE'
    }));
}

/**
 * Fetch a project's details.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The project data, or null.
 */
export async function getProject(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`);

    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
}

/**
 * Export a project as a downloadable blob.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Blob>} The export file blob.
 */
export async function exportProject(owner, project) {
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
 * @param {number} [take] - Results per page.
 * @param {number} [skip] - Offset for pagination.
 * @returns {Promise<{items: object[], totalCount: number}>} The paginated audit events and total count.
 */
export async function getAuditEvents(owner, project, take = 10, skip = 0) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/audit-events?take=${take}&skip=${skip}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const items = await response.json();
    const totalCount = parseInt(response.headers.get('X-Total-Count') || String(items.length), 10);

    return { items, totalCount: Number.isNaN(totalCount) ? items.length : totalCount };
}

/**
 * Import a project from a JSON file.
 * @param {File} file - The JSON export file.
 * @returns {Promise<object>} The import result.
 */
export async function importProject(file) {
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
 * Fetch permission records for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object[]>} The permission list.
 */
export async function getPermissions(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Invite a user to a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The invitation data (email, level).
 * @returns {Promise<object>} The created permission.
 */
export async function inviteUser(owner, project, data) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Search for users by name or email.
 * @param {string} query - The search term.
 * @returns {Promise<object[]>} Matching users.
 */
export async function searchUsers(query) {
    const parameters = new URLSearchParams({ q: String(query), max: '10' });
    return apiGet(`/api/users/search?${parameters}`);
}

/**
 * Remove a user's permission from a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number} permissionId - The permission ID to remove.
 * @returns {Promise<void>}
 */
export async function removePermission(owner, project, permissionId) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions/${permissionId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/**
 * Fetch the top-level promises for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object[]>} The promise list.
 */
export async function getProjectPromises(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Fetch the full project hierarchy as graph data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The graph data.
 */
export async function getGraphData(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/graph`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Fetch the member list for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object[]>} The member list.
 */
export async function getProjectMembers(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response ?? [];
}

/**
 * Fetch the current user's permission level for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The permission data, or null.
 */
export async function getMyPermission(owner, project) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Handle a fetch response, returning parsed JSON or undefined for 204.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<object|undefined>} Parsed JSON body, or undefined for 204 responses.
 */
function handleJsonOrNull(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return Promise.resolve();
    return response.json();
}

/**
 * Safely parse a JSON response, returning null on failure.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<object|null>} The parsed JSON object, or null if parsing fails.
 */
async function safeParse(response) {
    try {
        return await response.json();
    } catch {
        return;
    }
}
