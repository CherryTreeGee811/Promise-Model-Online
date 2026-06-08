import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getJourney = (owner, project, journeySeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}`);
export const getJourneyById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/by-id/${id}`);
export const getFlows = (owner, project, journeySeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows?journeySeq=${journeySeq}`);
export const createJourney = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/create`, data);
export const updateJourney = (owner, project, journeySeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}`, data);
export const updateJourneyDescription = (owner, project, journeySeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}/description`, { description });
