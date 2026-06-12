import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getEpic = (owner, project, epicSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}`);
export const getEpicById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/by-id/${id}`);
export const getJourneys = (owner, project, epicSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys?epicSeq=${epicSeq}`);
export const createEpic = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/create`, data);
export const updateEpic = (owner, project, epicSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}`, data);
export const updateEpicDescription = (owner, project, epicSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}/description`, { description });
