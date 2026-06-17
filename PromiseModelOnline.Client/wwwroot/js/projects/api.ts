import { authFetch, apiGet } from '../api.ts';

/**
 * Fetch all projects accessible to the current user.
 * @returns {Promise<object[]|null>} The list of projects, or null if none.
 */
export function fetchProjects() {
    return authFetch(`/api/projects`)
        .then(handleJsonOrNull);
}

/**
 * Create a new project.
 * @param {object} data - The project creation data.
 * @returns {Promise<object|null>} The created project, or null.
 */
export async function createProject(data) {
    const res = await authFetch(`/api/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.status === 204) return null;
    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

/**
 * Update a project's name and description.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The update data.
 * @returns {Promise<object>} The updated project.
 */
export async function updateProjectDetails(owner, project, data) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

/**
 * Delete a project by owner and project slug.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The deletion result, or null.
 */
export function deleteProject(owner, project) {
    return authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`, {
        method: 'DELETE'
    }).then(handleJsonOrNull);
}

/**
 * Fetch a project's details.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<object|null>} The project data, or null.
 */
export async function getProject(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/**
 * Export a project as a downloadable blob.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Blob>} The export file blob.
 */
export async function exportProject(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/export`);

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.blob();
}

/**
 * Fetch paginated audit events for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number} [take=10] - Results per page.
 * @param {number} [skip=0] - Offset for pagination.
 * @returns {Promise<{items: object[], totalCount: number}>}
 */
export async function getAuditEvents(owner, project, take = 10, skip = 0) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/audit-events?take=${take}&skip=${skip}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const items = await res.json();
    const totalCount = parseInt(res.headers.get('X-Total-Count') || `${items.length}`, 10);

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

    const res = await authFetch(`/api/projects/import`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const body = await safeParse(res);
        const message = body?.message
            || body?.title
            || (Array.isArray(body?.errors) ? body.errors.join(' ') : '')
            || `HTTP ${res.status}`;

        throw new Error(message);
    }

    return res.json();
}

/**
 * Fetch permission records for a project.
 * @returns {Promise<object[]>} The permission list.
 */
export async function getPermissions(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Invite a user to a project.
 * @param {object} data - The invitation data (email, level).
 * @returns {Promise<object>} The created permission.
 */
export async function inviteUser(owner, project, data) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Search for users by name or email.
 * @param {string} query - The search term.
 * @returns {Promise<object[]>} Matching users.
 */
export async function searchUsers(query) {
    const params = new URLSearchParams({ q: String(query), max: '10' });
    return apiGet(`/api/users/search?${params}`);
}

/**
 * Remove a user's permission from a project.
 * @param {number} permissionId - The permission ID to remove.
 */
export async function removePermission(owner, project, permissionId) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions/${permissionId}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Fetch the top-level promises for a project.
 * @returns {Promise<object[]>} The promise list.
 */
export async function getProjectPromises(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Fetch the full project hierarchy as graph data.
 * @returns {Promise<object|null>} The graph data.
 */
export async function getGraphData(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/graph`);
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Fetch the member list for a project.
 * @returns {Promise<object[]>} The member list.
 */
export async function getProjectMembers(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res ?? [];
}

/**
 * Fetch the current user's permission level for a project.
 * @returns {Promise<object|null>} The permission data, or null.
 */
export async function getMyPermission(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Handle a fetch response, returning parsed JSON or null for 204.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<object|null>} Parsed JSON body, or null for 204 responses.
 */
function handleJsonOrNull(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
}

/**
 * Safely parse a JSON response, returning null on failure.
 * @param {Response} res - The fetch response object.
 * @returns {Promise<object|null>} The parsed JSON object, or null if parsing fails.
 */
async function safeParse(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
