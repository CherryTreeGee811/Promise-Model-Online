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