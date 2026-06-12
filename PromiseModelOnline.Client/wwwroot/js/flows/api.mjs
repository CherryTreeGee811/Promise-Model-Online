import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getFlow = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`);
export const getFlowById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/by-id/${id}`);
export const getMoments = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?flowSeq=${flowSeq}`);
export const createFlow = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/create`, data);
export const updateFlow = (owner, project, flowSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`, data);
export const updateFlowDescription = (owner, project, flowSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}/description`, { description });
