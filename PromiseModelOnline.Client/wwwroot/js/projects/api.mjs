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