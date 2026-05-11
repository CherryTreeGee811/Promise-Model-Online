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