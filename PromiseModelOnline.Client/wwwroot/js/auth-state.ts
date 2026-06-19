/**
 * @file Legacy auth-state shim that delegates to the reactive auth store.
 * All exports kept for backward compatibility. New code should import
 * directly from `stores/auth.ts` for subscription support.
 */

export { authStore, isLoggedIn, getUsername, getUserId } from './stores/auth.ts';
