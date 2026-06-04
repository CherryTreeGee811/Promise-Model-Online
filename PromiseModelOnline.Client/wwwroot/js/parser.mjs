import { getUsername } from './auth-state.mjs';

export function getRoleFromToken() {
    return null;
}

export function getNameFromToken() {
    return getUsername();
}
