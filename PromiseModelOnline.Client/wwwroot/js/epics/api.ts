import { apiGet, apiPost, apiPatch } from '../api.ts';

export const getEpic = (owner: string, project: string, epicSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}`);
export const getEpicById = (owner: string, project: string, id: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/by-id/${id}`);
export const getJourneys = (owner: string, project: string, epicSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys?epicSeq=${epicSeq}`);
export const createEpic = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/create`, data);
export const updateEpicDescription = (owner: string, project: string, epicSeq: string | number, description: string) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}/description`, { description });
