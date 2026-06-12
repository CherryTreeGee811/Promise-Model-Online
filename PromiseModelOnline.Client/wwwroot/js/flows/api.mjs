<<<<<<< HEAD
import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getFlow = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`);
export const getFlowById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/by-id/${id}`);
export const getMoments = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?flowSeq=${flowSeq}`);
export const createFlow = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/create`, data);
export const updateFlow = (owner, project, flowSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`, data);
export const updateFlowDescription = (owner, project, flowSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}/description`, { description });
||||||| 1bedf4f
=======
import { authFetch, base } from '../api.mjs';

export function getFlowById(flowId) {
    return authFetch(`${base}/api/flows/${flowId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    });
}

export function getMomentsByFlow(flowId) {
    return authFetch(`${base}/api/moments?flowId=${flowId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (response.status === 204) return [];
        return response.json();
    });
}

export async function addFlow(flow) {
    const res = await authFetch(`${base}/api/flows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(flow)
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateFlow(flow) {
    const res = await authFetch(`${base}/api/flows/${flow.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(flow)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
}

export async function updateFlowDescription(flowId, description) {
    const res = await authFetch(`${base}/api/flows/${flowId}/description`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
