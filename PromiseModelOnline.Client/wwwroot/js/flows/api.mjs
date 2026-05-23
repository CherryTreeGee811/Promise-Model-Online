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