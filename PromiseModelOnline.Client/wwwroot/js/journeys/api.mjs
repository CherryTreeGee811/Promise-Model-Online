import { get, post, put } from '../api.mjs';

/*
====================================
GET JOURNEY
====================================
*/

export function getJourneyById(journeyId) {
    return get(`/journeys/${journeyId}`);
}

/*
====================================
GET FLOWS
====================================
*/

export function getFlowsByJourney(journeyId) {
    return get(`/flows?journeyId=${journeyId}`);
}

/*
====================================
CREATE JOURNEY
====================================
*/

export function addJourney(journey) {
    return post(`/journeys`, journey);
}

/*
====================================
UPDATE JOURNEY
====================================
*/

export function updateJourney(journey) {
    return put(`/journeys/${journey.id}`, journey);
}