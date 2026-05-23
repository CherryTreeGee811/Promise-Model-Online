import { authFetch, base } from '../api.mjs';

/*
====================================
GET JOURNEY
====================================
*/

export function getJourneyById(journeyId) {
    return authFetch(`${base}/api/journeys/${journeyId}`)
        .then(handleJson);
}

/*
====================================
GET FLOWS
====================================
*/

export function getFlowsByJourney(journeyId) {
    return authFetch(`${base}/api/flows?journeyId=${journeyId}`)
        .then(handleJsonOrEmpty);
}

/*
====================================
CREATE JOURNEY
====================================
*/

export async function addJourney(journey) {
    const res = await authFetch(`${base}/api/journeys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(journey)
    });

    if (res.status === 204) return null;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/*
====================================
UPDATE JOURNEY
====================================
*/

export async function updateJourney(journey) {
    const res = await authFetch(`${base}/api/journeys/${journey.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(journey)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return true;
}

/*
====================================
HELPERS
====================================
*/

function handleJson(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

function handleJsonOrEmpty(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    if (response.status === 204) return [];

    return response.json();
}