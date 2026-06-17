/**
 * @file Route guard definitions.
 * Guards return a GuardResult indicating whether navigation is allowed.
 * The router checks guards before executing route handlers.
 */

import { isLoggedIn } from './auth-state.ts';

/**
 * @typedef {{ allowed: true } | { allowed: false; redirect?: string }} GuardResult
 */

/**
 * Route guard function type.
 * Returns a GuardResult synchronously or asynchronously.
 * @typedef {() => GuardResult | Promise<GuardResult>} RouteGuard
 */

/**
 * Require the user to be authenticated.
 * Redirects to /login if not logged in.
 * @returns {GuardResult}
 */
export function requireAuth() {
  return isLoggedIn()
    ? { allowed: true }
    : { allowed: false, redirect: '/login' };
}
