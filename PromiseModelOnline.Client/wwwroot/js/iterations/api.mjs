import { get } from '../api.mjs';

/*
====================================
ITERATIONS
====================================
*/

export function getIterationsByProject(projectId) {
    return get(`/iterations?projectId=${projectId}`);
}

export function getIterationBurndown(iterationId) {
    return get(`/iterations/${iterationId}/burndown`);
}