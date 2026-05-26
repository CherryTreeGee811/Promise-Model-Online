import { get, post, put } from '../api.mjs';

/*
====================================
GET FLOW
====================================
*/

export function getFlowById(flowId) {
    return get(`/flows/${flowId}`);
}

/*
====================================
GET MOMENTS BY FLOW
====================================
*/

export function getMomentsByFlow(flowId) {
    return get(`/moments?flowId=${flowId}`);
}

/*
====================================
CREATE FLOW
====================================
*/

export function addFlow(flow) {
    return post(`/flows`, flow);
}

/*
====================================
UPDATE FLOW
====================================
*/

export function updateFlow(flow) {
    return put(`/flows/${flow.id}`, flow);
}