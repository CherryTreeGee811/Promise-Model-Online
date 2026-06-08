import { authFetch } from '../api.mjs';

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

export async function getProjectMembers(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res ?? [];
}

export async function getMyPermission(owner, project) {
    const res = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res ?? null;
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
