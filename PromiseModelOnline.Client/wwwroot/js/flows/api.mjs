import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getFlowById = flowId => apiGet(`/api/flows/${flowId}`);
export const getMomentsByFlow = flowId => apiGet(`/api/moments?flowId=${flowId}`);
export const addFlow = flow => apiPost('/api/flows', flow);
export const updateFlow = flow => apiPut(`/api/flows/${flow.id}`, flow);
export const updateFlowDescription = (flowId, description) => apiPatch(`/api/flows/${flowId}/description`, { description });
