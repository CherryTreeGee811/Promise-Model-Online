import { getUsername } from './auth-state.mjs';

export function getCurrentUserName() {
    return getUsername();
}
