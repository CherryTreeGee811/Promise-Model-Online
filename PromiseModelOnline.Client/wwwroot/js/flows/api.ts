import { apiGet, apiPost, apiPatch } from '../api.ts';

export const getFlow = (owner: string, project: string, flowSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`);
export const getFlowById = (owner: string, project: string, id: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/by-id/${id}`);
export const getMoments = (owner: string, project: string, flowSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?flowSeq=${flowSeq}`);
export const createFlow = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/create`, data);
export const updateFlowDescription = (owner: string, project: string, flowSeq: string | number, description: string) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}/description`, { description });
