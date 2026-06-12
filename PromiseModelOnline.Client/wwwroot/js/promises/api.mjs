import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`);
export const getPromiseById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/by-id/${id}`);
export const getEpicsByPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics?promiseSeq=${promiseSeq}`);
export const createPromise = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/create`, data);
export const updatePromise = (owner, project, promiseSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`, data);
export const updatePromiseDescription = (owner, project, promiseSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}/description`, { description });
