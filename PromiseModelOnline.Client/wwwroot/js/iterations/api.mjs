import { apiGet, apiGetList, apiPost } from '../api.mjs';

export const getIterationsByProject = projectId => apiGetList(`/api/iterations?projectId=${projectId}`);
export const createIteration = (projectId, name) => apiPost('/api/iterations', { projectId, name });
export const getIterationBurndown = iterationId => apiGet(`/api/iterations/${iterationId}/burndown`);
