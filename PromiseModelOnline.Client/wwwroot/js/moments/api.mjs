<<<<<<< HEAD
import { apiGet, apiPost, apiPatch } from '../api.mjs';

export const getMoment = (owner, project, momentSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}`);
export const getMomentById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/by-id/${id}`);
export const createMoment = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/create`, data);
export const getMyAssignedMoments = () => apiGet('/api/moments/assigned-to-me');

export const assignMomentToStride = (owner, project, momentSeq, strideId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/stride-assignment`, { strideId });
export const updateMomentStatus = (owner, project, momentSeq, status) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/status`, { newStatus: status });
export const updateMomentEstimate = (owner, project, momentSeq, estimate) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/estimate`, { estimate });
export const updateMomentType = (owner, project, momentSeq, type) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/type`, { newType: type });
export const updateMomentOwner = (owner, project, momentSeq, userId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/owner`, { userId });
export const updateMomentDescription = (owner, project, momentSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/description`, { description });
export const createTask = (owner, project, momentSeq, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks`, data);
export const updateTaskCompletion = (owner, project, momentSeq, taskId, isCompleted) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks/${taskId}/completion`, { isCompleted });
||||||| 1bedf4f
=======
import { authFetch, base } from '../api.mjs';

/*
====================================
GET MOMENT
====================================
*/
export function getMomentById(momentId) {
    return authFetch(`${base}/api/moments/${momentId}`)
        .then(handleJson);
}

/*
====================================
MOVE MOMENT
====================================
*/
export async function moveMomentToStride(momentId, targetStrideId) {
    const res = await authFetch(`${base}/api/moments/${momentId}/stride-assignment`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ strideId: targetStrideId })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
STATUS / ESTIMATE / TYPE
====================================
*/
export async function updateMomentStatus(momentId, newStatus) {
    const res = await authFetch(`${base}/api/moments/${momentId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStatus })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateMomentEstimate(momentId, estimate) {
    const res = await authFetch(`${base}/api/moments/${momentId}/estimate`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estimate })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateMomentType(momentId, newType) {
    const res = await authFetch(`${base}/api/moments/${momentId}/type`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newType })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (res.status === 204) return null;
    return res.json();
}

/*
====================================
OWNER
====================================
*/

export async function updateMomentOwner(momentId, userId) {
    const res = await authFetch(`${base}/api/moments/${momentId}/owner`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
TASKS
====================================
*/

export async function getMyTasks() {
    const res = await authFetch(`${base}/api/moments/assigned-to-me`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
CREATE MOMENT
====================================
*/

export async function addMoment(moment) {
    const res = await authFetch(`${base}/api/moments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(moment)
    });

    if (res.status === 204) return null;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/*
====================================
HELPER
====================================
*/

function handleJson(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

export async function addMomentTask(momentId, task) {
    const res = await authFetch(`${base}/api/moments/${momentId}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateMomentTaskCompletion(momentId, taskId, isCompleted) {
    const res = await authFetch(`${base}/api/moments/${momentId}/tasks/${taskId}/completion`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted })
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateMomentDescription(momentId, description) {
    const res = await authFetch(`${base}/api/moments/${momentId}/description`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
