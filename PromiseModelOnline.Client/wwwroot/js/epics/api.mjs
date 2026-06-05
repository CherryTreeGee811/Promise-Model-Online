import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getEpicById = epicId => apiGet(`/api/epics/${epicId}`);
export const getJourneysByEpic = epicId => apiGet(`/api/journeys?epicId=${epicId}`);
export const addEpic = epic => apiPost('/api/epics', epic);
export const updateEpic = epic => apiPut(`/api/epics/${epic.id}`, epic);
export const updateEpicDescription = (epicId, description) => apiPatch(`/api/epics/${epicId}/description`, { description });