import { get, post } from '../api.mjs';

/*
====================================
GET COMMENTS
====================================
*/

export function getComments(parentType, parentId) {
    return get(
        `/comments?type=${encodeURIComponent(parentType)}&parentId=${parentId}`
    );
}

/*
====================================
POST COMMENT
====================================
*/

export function postComment(parentType, parentId, text, parentCommentId = null) {
    return post(`/comments`, {
        text,
        parentType,
        parentId,
        parentCommentId
    });
}