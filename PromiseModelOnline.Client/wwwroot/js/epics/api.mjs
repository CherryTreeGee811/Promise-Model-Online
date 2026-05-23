import { authFetch, base } from '../api.mjs';

export function getEpicById(epicId) {
    return authFetch(`${base}/api/epics/${epicId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    });
}

export function getJourneysByEpic(epicId) {
    return authFetch(`${base}/api/journeys?epicId=${epicId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (response.status === 204) return [];
        return response.json();
    });
}

export async function addEpic(epic) {
    const res = await authFetch(`${base}/api/epics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epic),
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateEpic(epic) {
    const res = await authFetch(`${base}/api/epics/${epic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epic),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
}

export async function updateEpicDescription(epicId, description) {
    const res = await authFetch(`${base}/api/epics/${epicId}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}