import { authFetch } from '../api.mjs';

/*
====================================
ITERATIONS
====================================
*/

export async function getIterationsByProject(projectId) {
    const res = await authFetch(`/api/iterations?projectId=${projectId}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function createIteration(projectId, name) {
    const res = await authFetch(`/api/iterations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectId,
            name,
        }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function getIterationBurndown(iterationId) {
    const res = await authFetch(`/api/iterations/${iterationId}/burndown`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}