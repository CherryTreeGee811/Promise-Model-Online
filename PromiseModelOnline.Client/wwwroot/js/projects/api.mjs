import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';


export function getAllProjects() {
    const url = `${base}/api/projects`;
    const accessToken = getAccessTokenFromCookie();

    return fetch(url, {
        mode: 'cors',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
        .then(response => {
            if (response.ok) {
                if (response.status === 204) {
                    return null;
                } else {
                    return response.json();
                }
            } else if (response.status == 401) {
                const loginLinkElem = document.getElementById("login-link");
                loginLinkElem.style.display = "block";
                loginLinkElem.ariaHidden = false;
                loginLinkElem.click();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .catch(error => {
            throw error;
        });
}

export async function addProject(project) {
    const url = `${base}/api/projects/create`;
    const token = getAccessTokenFromCookie();
    const res = await fetch(url, {
        mode: 'cors',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(project)
    });

    if (res.ok) {
        if (res.status === 204) {
            return null;
        }
        return res.json();
    } else if (res.status == 401) {
        const loginLinkElem = document.getElementById("login-link");
        loginLinkElem.style.display = "block";
        loginLinkElem.ariaHidden = false;
        loginLinkElem.click();
    } else {
        // Try to parse problem details / error body for more info
        try {
            const body = await res.json();
            const msg = body && (body.title || body.message || body.detail || JSON.stringify(body));
            throw new Error(msg || `HTTP error! status: ${res.status}`);
        } catch (e) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
    }
}

export function deleteProject(projectId) {
    const url = `${base}/api/projects/${projectId}`;
    const accessToken = getAccessTokenFromCookie();

    return fetch(url, {
        mode: 'cors',
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
        .then(response => {
            if (response.ok) {
                if (response.status === 204) {
                    return null;
                } else {
                    return response.json();
                }
            } else if (response.status == 401) {
                const loginLinkElem = document.getElementById("login-link");
                loginLinkElem.style.display = "block";
                loginLinkElem.ariaHidden = false;
                loginLinkElem.click();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .catch(error => {
            throw error;
        });
}

export async function getProjectPermissions(projectId) {
    const url = `${base}/api/permissions?projectId=${projectId}`;
    const token = getAccessTokenFromCookie();
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function inviteUserToProject(userEmail, projectId, level) {
    const url = `${base}/api/permissions`;
    const token = getAccessTokenFromCookie();
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ userEmail, projectId, level })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function revokePermission(permissionId) {
    const url = `${base}/api/permissions/${permissionId}`;
    const token = getAccessTokenFromCookie();
    const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function getProjectPromises(projectId) {
    const url = `${base}/api/projects/${projectId}/promises`;
    const token = getAccessTokenFromCookie();
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}