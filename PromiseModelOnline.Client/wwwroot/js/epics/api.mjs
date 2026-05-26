import { get, post, put } from '../api.mjs';

/*
====================================
GET EPIC
====================================
*/

export function getEpicById(epicId) {
    return get(`/epics/${epicId}`);
}

/*
====================================
GET JOURNEYS BY EPIC
====================================
*/

export function getJourneysByEpic(epicId) {
    return get(`/journeys?epicId=${epicId}`);
}

/*
====================================
CREATE EPIC
====================================
*/

export function addEpic(epic) {
    return post(`/epics`, epic);
}

/*
====================================
UPDATE EPIC
====================================
*/

export function updateEpic(epic) {
    return put(`/epics/${epic.id}`, epic);
}