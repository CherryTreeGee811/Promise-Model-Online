import { get, post, del } from '../api.mjs';

/*
====================================
PROJECTS
====================================
*/

export function getAllProjects() {
    return get(`/projects`);
}

export async function addProject(project) {
    try {
        return await post(`/projects/create`, project);
    } catch (err) {
        // ✅ Preserve your custom API error parsing behavior
        try {
            const parsed = JSON.parse(err.message.replace(/^.* - /, ""));
            throw new Error(parsed?.message || parsed?.title || err.message);
        } catch {
            throw err;
        }
    }
}

export function deleteProject(projectId) {
    return del(`/projects/${projectId}`);
}

export function getProjectById(projectId) {
    return get(`/projects/${projectId}`);
}

/*
====================================
PERMISSIONS
====================================
*/

export function getProjectPermissions(projectId) {
    return get(`/permissions?projectId=${projectId}`);
}

export function inviteUserToProject(userEmail, projectId, level) {
    return post(`/permissions`, {
        userEmail,
        projectId,
        level
    });
}

export function revokePermission(permissionId) {
    return del(`/permissions/${permissionId}`);
}

/*
====================================
PROMISES
====================================
*/

export function getProjectPromises(projectId) {
    return get(`/projects/${projectId}/promises`);
}