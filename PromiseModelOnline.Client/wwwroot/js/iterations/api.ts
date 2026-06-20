import { apiGet, apiGetList, apiPost } from '../api.ts';

export const getIterations = (owner: string, project: string) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);
export const createIteration = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`, data);
export const getBurndown = (owner: string, project: string, iterationId: string | number) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations/${iterationId}/burndown`);
