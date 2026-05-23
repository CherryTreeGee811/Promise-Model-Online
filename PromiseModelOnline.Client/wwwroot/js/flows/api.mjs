import { getAccessToken } from '../auth-state.mjs';
import { base } from '../api.mjs';

export function getFlowById(flowId) {
    const url = `${base}/api/flows/${flowId}`;
    const token = getAccessToken();

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

export function getMomentsByFlow(flowId) {
    const url = `${base}/api/moments?flowId=${flowId}`;
    const token = getAccessToken();

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

export async function addFlow(flow) {
    const url = `${base}/api/flows`;
    const token = getAccessToken();

    const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(flow)
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

export async function updateFlow(flow) {
    const url = `${base}/api/flows/${flow.id}`;
    const token = getAccessToken();

    const res = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(flow)
    });

    if (res.ok) {
        return true;
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}