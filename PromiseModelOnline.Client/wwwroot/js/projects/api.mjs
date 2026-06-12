<<<<<<< HEAD
import { authFetch, apiGet } from '../api.mjs';

export function fetchProjects() {
    return authFetch(`/api/projects`)
        .then(handleJsonOrNull);
}

export async function createProject(data) {
    const res = await authFetch(`/api/projects/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (res.status === 204) return null;

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function updateProjectDetails(owner, project, data) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/details`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

export function deleteProject(owner, project) {
    return authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`, {
        method: 'DELETE'
    }).then(handleJsonOrNull);
}

export async function getProject(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function exportProject(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/export`);

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.blob();
}

export async function getAuditEvents(owner, project, take = 10, skip = 0) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/audit-events?take=${take}&skip=${skip}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const items = await res.json();
    const totalCount = parseInt(res.headers.get('X-Total-Count') || `${items.length}`, 10);

    return { items, totalCount: Number.isNaN(totalCount) ? items.length : totalCount };
}

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

export async function getPermissions(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function inviteUser(owner, project, data) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function searchUsers(query) {
    const params = new URLSearchParams({ q: query, max: 10 });
    return apiGet(`/api/users/search?${params}`);
}

export async function removePermission(owner, project, permissionId) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions/${permissionId}`, {
        method: 'DELETE'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function getProjectPromises(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getGraphData(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/graph`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function getProjectMembers(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res ?? [];
}

export async function getMyPermission(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function handleJsonOrNull(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    if (response.status === 204) return null;

    return response.json();
}

async function safeParse(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
||||||| 1bedf4f
=======
import { authFetch, base } from '../api.mjs';

/*
====================================
PROJECTS
====================================
*/

export function getAllProjects() {
    return authFetch(`${base}/api/projects`)
        .then(handleJsonOrNull);
}

export async function addProject(project) {
    const res = await authFetch(`${base}/api/projects/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(project)
    });

    if (res.status === 204) return null;

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function updateProjectDetails(projectId, details) {
    const res = await authFetch(`${base}/api/projects/${projectId}/details`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)
    });

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.json();
}

export function deleteProject(projectId) {
    return authFetch(`${base}/api/projects/${projectId}`, {
        method: 'DELETE'
    }).then(handleJsonOrNull);
}

export async function getProjectById(projectId) {
    const res = await authFetch(`${base}/api/projects/${projectId}`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function exportProject(projectId) {
    const res = await authFetch(`${base}/api/projects/${projectId}/export`);

    if (!res.ok) {
        const body = await safeParse(res);
        throw new Error(body?.message || body?.title || `HTTP ${res.status}`);
    }

    return res.blob();
}

export async function importProject(file) {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await authFetch(`${base}/api/projects/import`, {
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

/*
====================================
PERMISSIONS
====================================
*/

export async function getProjectPermissions(projectId) {
    const res = await authFetch(`${base}/api/permissions?projectId=${projectId}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function inviteUserToProject(userEmail, projectId, level) {
    const res = await authFetch(`${base}/api/permissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail, projectId, level })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function revokePermission(permissionId) {
    const res = await authFetch(`${base}/api/permissions/${permissionId}`, {
        method: 'DELETE'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/*
====================================
PROMISES
====================================
*/

export async function getProjectPromises(projectId) {
    const res = await authFetch(`${base}/api/projects/${projectId}/promises`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
HELPERS
====================================
*/

function handleJsonOrNull(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    if (response.status === 204) return null;

    return response.json();
}

async function safeParse(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
