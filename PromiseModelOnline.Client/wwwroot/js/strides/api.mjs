import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export function getStridesByIteration(iterationId) {
    const url = `${base}/api/strides?iterationId=${iterationId}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export function getAllStrides() {
    const url = `${base}/api/strides`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export function getMomentsByStride(strideId) {
    const url = `${base}/api/moments?strideId=${strideId}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export function getBacklogMoments(projectId) {
    const url = `${base}/api/moments?projectId=${projectId}&unassigned=true`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export function getIterationsByProject(projectId) {
    const url = `${base}/api/iterations?projectId=${projectId}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export function getMomentsByIteration(iterationId, unassigned = false) {
    const url = `${base}/api/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

/**
 * Fetches members of a project (owner + invited users).
 */
export async function getProjectMembers(projectId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/projects/${projectId}/members`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Assigns a new owner to a moment.
 */
export async function updateMomentOwner(momentId, userId) {
    const url = `${base}/api/moments/${momentId}/owner`;
    const token = getAccessTokenFromCookie();
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ userId })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function getMyPermission(projectId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/projects/${projectId}/my-permission`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();   // returns "Edit", "Comment", "View", or null
}

/**
 * Progress a stride: move unfinished moments to the next stride.
 */
export async function progressStride(strideId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/strides/${strideId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressUnfinishedMoments: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Send deadline notifications for all strides ending in 3 days.
 */
export async function sendDeadlineNotifications() {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/deadline-notification-runs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}