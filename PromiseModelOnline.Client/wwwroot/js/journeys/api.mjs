import { authFetch, base } from '../api.mjs';

export function getJourneyById(journeyId) {
    return authFetch(`${base}/api/journeys/${journeyId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    });
}

export function getFlowsByJourney(journeyId) {
    return authFetch(`${base}/api/flows?journeyId=${journeyId}`).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (response.status === 204) return [];
        return response.json();
    });
}

export async function addJourney(journey) {
    const res = await authFetch(`${base}/api/journeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journey),
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateJourney(journey) {
    const res = await authFetch(`${base}/api/journeys/${journey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journey),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
}

export async function updateJourneyDescription(journeyId, description) {
    const res = await authFetch(`${base}/api/journeys/${journeyId}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function handleJsonOrEmpty(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return [];
    return response.json();
}