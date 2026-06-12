import { apiGet, apiGetList, apiPost } from '../api.mjs';

export const getIterations = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);
export const createIteration = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`, data);
export const getBurndown = (owner, project, iterationId) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations/${iterationId}/burndown`);
