import { authFetch, apiGet } from '../api.ts';

export async function fetchProjects() {
    return handleJsonOrNull(await authFetch(`/api/projects`));
}

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

export async function deleteProject(owner: string, project: string) {
    return handleJsonOrNull(await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`, {
        method: 'DELETE'
    }));
}

export async function getProject(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}`);

    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
}

export async function exportProject(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/export`);

    if (!response.ok) {
        const body = await safeParse(response);
        throw new Error(body?.message || body?.title || `HTTP ${response.status}`);
    }

    return response.blob();
}

export async function getAuditEvents(owner: string, project: string, take: number = 10, skip: number = 0) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/audit-events?take=${take}&skip=${skip}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const items = await response.json();
    const totalCount = parseInt(response.headers.get('X-Total-Count') || String(items.length), 10);

    return { items, totalCount: Number.isNaN(totalCount) ? items.length : totalCount };
}

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

export async function getPermissions(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function inviteUser(owner: string, project: string, data: Record<string, unknown>) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function searchUsers(query: string) {
    const parameters = new URLSearchParams({ q: query, max: '10' });
    return apiGet(`/api/users/search?${parameters}`);
}

export async function removePermission(owner: string, project: string, permissionId: string | number) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/permissions/${permissionId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}


export async function getGraphData(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/graph`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}


export async function getMyPermission(owner: string, project: string) {
    const response = await authFetch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function handleJsonOrNull(response: Response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return Promise.resolve();
    return response.json();
}

async function safeParse(response: Response) {
    try {
        return await response.json();
    } catch {
        return;
    }
}
