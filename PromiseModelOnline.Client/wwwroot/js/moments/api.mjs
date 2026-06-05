import { apiGet, apiPost, apiPatch } from '../api.mjs';

export const getMomentById = momentId => apiGet(`/api/moments/${momentId}`);
export const addMoment = moment => apiPost('/api/moments', moment);
export const getMyTasks = () => apiGet('/api/moments/assigned-to-me');

export const moveMomentToStride = (momentId, targetStrideId) => apiPatch(`/api/moments/${momentId}/stride-assignment`, { strideId: targetStrideId });
export const updateMomentStatus = (momentId, newStatus) => apiPatch(`/api/moments/${momentId}/status`, { newStatus });
export const updateMomentEstimate = (momentId, estimate) => apiPatch(`/api/moments/${momentId}/estimate`, { estimate });
export const updateMomentType = (momentId, newType) => apiPatch(`/api/moments/${momentId}/type`, { newType });
export const updateMomentOwner = (momentId, userId) => apiPatch(`/api/moments/${momentId}/owner`, { userId });
export const updateMomentDescription = (momentId, description) => apiPatch(`/api/moments/${momentId}/description`, { description });
export const addMomentTask = (momentId, task) => apiPost(`/api/moments/${momentId}/tasks`, task);
export const updateMomentTaskCompletion = (momentId, taskId, isCompleted) => apiPatch(`/api/moments/${momentId}/tasks/${taskId}/completion`, { isCompleted });
