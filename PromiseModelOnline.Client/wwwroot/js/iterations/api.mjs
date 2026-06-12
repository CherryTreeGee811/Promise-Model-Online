<<<<<<< HEAD
import { apiGet, apiGetList, apiPost } from '../api.mjs';

export const getIterations = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);
export const createIteration = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`, data);
export const getBurndown = (owner, project, iterationId) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations/${iterationId}/burndown`);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
