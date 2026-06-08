import { apiGet, apiPost, projectUrl } from '../api.mjs';

export const getComments = (owner, project, parentType, parentId) =>
    apiGet(`${projectUrl(owner, project)}/comments?type=${parentType}&parentId=${parentId}`);
export const addComment = (owner, project, data) =>
    apiPost(`${projectUrl(owner, project)}/comments`, data);
