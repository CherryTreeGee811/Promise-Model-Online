import { apiGet, apiPost, apiPatch } from '../api.mjs';

export const getMoment = (owner, project, momentSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}`);
export const getMomentById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/by-id/${id}`);
export const createMoment = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/create`, data);
export const getMyAssignedMoments = () => apiGet('/api/moments/assigned-to-me');

export const assignMomentToStride = (owner, project, momentSeq, strideId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/stride-assignment`, { strideId });
export const updateMomentStatus = (owner, project, momentSeq, status) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/status`, { newStatus: status });
export const updateMomentEstimate = (owner, project, momentSeq, estimate) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/estimate`, { estimate });
export const updateMomentType = (owner, project, momentSeq, type) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/type`, { newType: type });
export const updateMomentOwner = (owner, project, momentSeq, userId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/owner`, { userId });
export const updateMomentDescription = (owner, project, momentSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/description`, { description });
export const createTask = (owner, project, momentSeq, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks`, data);
export const updateTaskCompletion = (owner, project, momentSeq, taskId, isCompleted) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks/${taskId}/completion`, { isCompleted });
