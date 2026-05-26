import { get, post, put } from '../api.mjs';

/*
====================================
GET PROMISE
====================================
*/
export function getPromiseById(promiseId) {
    return get(`/promises/${promiseId}`);
}

/*
====================================
GET EPICS
====================================
*/
export function getEpicsByPromise(promiseId) {
    return get(`/epics?promiseId=${promiseId}`);
}

/*
====================================
CREATE PROMISE
====================================
*/
export function addPromise(promise) {
    return post(`/promises`, promise);
}

/*
====================================
UPDATE PROMISE
====================================
*/
export function updatePromise(promise) {
    return put(`/promises/${promise.id}`, promise);
}