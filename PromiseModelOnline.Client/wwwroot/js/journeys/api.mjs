import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export function getJourneyById(journeyId) {
    const url = `${base}/api/journeys/${journeyId}`;
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

export function getFlowsByJourney(journeyId) {
    const url = `${base}/api/flows?journeyId=${journeyId}`;
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

export async function addJourney(journey) {
    const url = `${base}/api/journeys/create`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(journey)
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

export async function updateJourney(journey) {
    const url = `${base}/api/journeys/${journey.id}`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(journey)
    });

    if (res.ok) {
        return true;
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}

export async function updateJourneyDescription(journeyId, description) {
    const url = `${base}/api/journeys/${journeyId}/description`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify({ description }),
    });

    if (res.ok) {
        return res.json();
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}