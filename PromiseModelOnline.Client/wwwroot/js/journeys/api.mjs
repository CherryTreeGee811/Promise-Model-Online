import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getJourneyById = journeyId => apiGet(`/api/journeys/${journeyId}`);
export const getFlowsByJourney = journeyId => apiGet(`/api/flows?journeyId=${journeyId}`);
export const addJourney = journey => apiPost('/api/journeys', journey);
export const updateJourney = journey => apiPut(`/api/journeys/${journey.id}`, journey);
export const updateJourneyDescription = (journeyId, description) => apiPatch(`/api/journeys/${journeyId}/description`, { description });
