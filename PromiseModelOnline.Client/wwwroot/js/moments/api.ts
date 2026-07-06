import { apiGet, apiPost, apiPatch } from '../api.ts';

const withFlowId = (url: string, flowId?: number) =>
    flowId !== undefined ? `${url}${url.includes('?') ? '&' : '?'}flowId=${flowId}` : url;

export const getMoment = (owner: string, project: string, momentSeq: string | number, flowId?: number) => apiGet(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}`, flowId));
export const createMoment = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/create`, data);
export const getMyAssignedMoments = () => apiGet('/api/moments/assigned-to-me');
export const assignMomentToStride = (owner: string, project: string, momentSeq: string | number, strideId: string | number | undefined, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/stride-assignment`, flowId), { strideId });
export const updateMomentStatus = (owner: string, project: string, momentSeq: string | number, status: string, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/status`, flowId), { newStatus: status });
export const updateMomentEstimate = (owner: string, project: string, momentSeq: string | number, estimate: string | undefined, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/estimate`, flowId), { estimate });
export const updateMomentType = (owner: string, project: string, momentSeq: string | number, type: string, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/type`, flowId), { newType: type });
export const updateMomentOwner = (owner: string, project: string, momentSeq: string | number, userId: string | number, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/owner`, flowId), { userId });
export const updateMomentDescription = (owner: string, project: string, momentSeq: string | number, description: string, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/description`, flowId), { description });
export const createTask = (owner: string, project: string, momentSeq: string | number, data: Record<string, unknown>, flowId?: number) => apiPost(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks`, flowId), data);
export const updateTaskCompletion = (owner: string, project: string, momentSeq: string | number, taskId: string | number, isCompleted: boolean, flowId?: number) => apiPatch(withFlowId(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks/${taskId}/completion`, flowId), { isCompleted });
