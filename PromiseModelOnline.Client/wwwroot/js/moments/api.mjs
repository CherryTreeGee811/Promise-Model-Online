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
