import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getPromiseById = promiseId => apiGet(`/api/promises/${promiseId}`);
export const getEpicsByPromise = promiseId => apiGet(`/api/epics?promiseId=${promiseId}`);
export const addPromise = promise => apiPost('/api/promises/create', promise);
export const updatePromise = promise => apiPut(`/api/promises/${promise.id}`, promise);
export const updatePromiseDescription = (promiseId, description) => apiPatch(`/api/promises/${promiseId}/description`, { description });
