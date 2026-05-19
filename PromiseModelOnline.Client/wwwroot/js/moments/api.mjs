import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

/**
 * Fetch a single moment by its ID.
 * @param {number|string} momentId
 * @returns {Promise<object>}
 */
export function getMomentById(momentId) {
    const url = `${base}/api/moments/${momentId}`;
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
        if (!response.ok) {
            if (response.status === 401) {
                document.getElementById("login-link")?.click();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

/**
 * Move a moment to a different stride or to the backlog.
 * @param {number} momentId
 * @param {number|null} targetStrideId – null moves to backlog
 * @returns {Promise<object>} the updated MomentDTO
 */
export async function moveMomentToStride(momentId, targetStrideId) {
    const url = `${base}/api/moments/${momentId}/stride-assignment`;
    const token = getAccessTokenFromCookie();
    const response = await fetch(url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ strideId: targetStrideId })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Update a moment's status.
 * @param {number} momentId
 * @param {string} newStatus – "Todo", "InProgress", "Blocked", "Done"
 * @returns {Promise<object>} the updated MomentDTO
 */
export async function updateMomentStatus(momentId, newStatus) {
    const url = `${base}/api/moments/${momentId}/status`;
    const token = getAccessTokenFromCookie();
    const response = await fetch(url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ newStatus })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function updateMomentEstimate(momentId, estimate) {
    const url = `${base}/api/moments/${momentId}/estimate`;
    const token = getAccessTokenFromCookie();
    const response = await fetch(url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ estimate })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function getMyTasks() {
    const token = getAccessTokenFromCookie();
    if (!token) return [];
    const url = `${base}/api/moments/assigned-to-me`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Assigns a new owner to a moment, or clears the owner when userId is null.
 * @param {number} momentId
 * @param {number|null} userId
 * @returns {Promise<object>} the updated MomentDTO
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

/**
 * Create a new Moment.
 * @param {object} moment - Moment creation DTO
 * @returns {Promise<object|null>} created MomentDTO or null for 204
 */
export async function addMoment(moment) {
    const url = `${base}/api/moments`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA'
        },
        body: JSON.stringify(moment)
    });

    if (res.ok) {
        if (res.status === 204) return null;
        return res.json();
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}