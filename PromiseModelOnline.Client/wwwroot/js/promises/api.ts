import { apiGet, apiPost, apiPatch } from '../api.ts';

export const getPromise = (owner: string, project: string, promiseSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`);
export const getPromiseById = (owner: string, project: string, id: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/by-id/${id}`);
export const getEpicsByPromise = (owner: string, project: string, promiseSeq: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics?promiseSeq=${promiseSeq}`);
export const createPromise = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/create`, data);
export const updatePromiseDescription = (owner: string, project: string, promiseSeq: string | number, description: string) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}/description`, { description });
