import { apiGet, apiPost, apiPatch } from '../api.ts';

/**
 * Fetch a moment by its sequence number.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @returns {Promise<object>} The moment data.
 */
export const getMoment = (owner, project, momentSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}`);
/**
 * Fetch a moment by its internal ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} id - The moment's internal ID.
 * @returns {Promise<object>} The moment data.
 */
export const getMomentById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/by-id/${id}`);
/**
 * Create a new moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The moment creation payload.
 * @returns {Promise<object>} The created moment.
 */
export const createMoment = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/create`, data);
/**
 * Fetch moments assigned to the current user.
 * @returns {Promise<object[]>} The list of assigned moments.
 */
export const getMyAssignedMoments = () => apiGet('/api/moments/assigned-to-me');
/**
 * Assign a moment to a stride.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {number|null} strideId - The stride ID to assign, or null for backlog.
 * @returns {Promise<object>} The updated moment.
 */
export const assignMomentToStride = (owner, project, momentSeq, strideId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/stride-assignment`, { strideId });
/**
 * Update the status of a moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {string} status - The new status value.
 * @returns {Promise<object>} The updated moment.
 */
export const updateMomentStatus = (owner, project, momentSeq, status) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/status`, { newStatus: status });
/**
 * Update the effort estimate of a moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {string|null} estimate - The effort estimate value or null.
 * @returns {Promise<object>} The updated moment.
 */
export const updateMomentEstimate = (owner, project, momentSeq, estimate) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/estimate`, { estimate });
/**
 * Update the type of a moment (Story or Job).
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {string} type - The new type value.
 * @returns {Promise<object>} The updated moment.
 */
export const updateMomentType = (owner, project, momentSeq, type) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/type`, { newType: type });
/**
 * Update the owner (assignee) of a moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {number|null} userId - The user ID to assign, or null to unassign.
 * @returns {Promise<object>} The updated moment.
 */
export const updateMomentOwner = (owner, project, momentSeq, userId) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/owner`, { userId });
/**
 * Update the description of a moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {string} description - The new description text.
 * @returns {Promise<object>} The updated moment.
 */
export const updateMomentDescription = (owner, project, momentSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/description`, { description });
/**
 * Create a new task within a moment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {object} data - The task creation payload.
 * @returns {Promise<object>} The created task.
 */
export const createTask = (owner, project, momentSeq, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks`, data);
/**
 * Update the completion status of a task.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} momentSeq - The moment's sequence number.
 * @param {number} taskId - The task's ID.
 * @param {boolean} isCompleted - Whether the task is completed.
 * @returns {Promise<object>} The updated task.
 */
export const updateTaskCompletion = (owner, project, momentSeq, taskId, isCompleted) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments/${momentSeq}/tasks/${taskId}/completion`, { isCompleted });
