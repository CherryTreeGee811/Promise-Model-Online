import { apiGet, apiPost, apiPatch } from '../api.ts';

export const getJourney = (owner: string, project: string, journeySeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}`);
export const getJourneyById = (owner: string, project: string, id: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/by-id/${id}`);
export const getFlows = (owner: string, project: string, journeySeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows?journeySeq=${journeySeq}`);
export const createJourney = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/create`, data);
export const updateJourneyDescription = (owner: string, project: string, journeySeq: string | number, description: string) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}/description`, { description });
