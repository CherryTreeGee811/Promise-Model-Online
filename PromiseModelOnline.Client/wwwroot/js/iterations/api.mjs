import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export async function getIterationsByProject(projectId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/iterations?projectId=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getIterationBurndown(iterationId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/iterations/${iterationId}/burndown`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}