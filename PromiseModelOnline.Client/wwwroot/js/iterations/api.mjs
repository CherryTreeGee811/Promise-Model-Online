import { authFetch, base } from '../api.mjs';

/*
====================================
ITERATIONS
====================================
*/

export async function getIterationsByProject(projectId) {
    const res = await authFetch(`${base}/api/iterations?projectId=${projectId}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export async function getIterationBurndown(iterationId) {
    const res = await authFetch(`${base}/api/iterations/${iterationId}/burndown`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}