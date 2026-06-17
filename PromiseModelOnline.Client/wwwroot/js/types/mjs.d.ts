/* Wildcard declarations for .mjs modules imported from .ts files.
   As each .mjs file is converted to .ts, remove the corresponding export from here. */

declare module '*.mjs' {
  /* auth-state.mjs */
  export function setAuthState(state: { isAuthenticated: boolean; username?: string; userId?: number }): void;
  export function clearAuth(): void;
  export function getUsername(): string | null;
  export function isLoggedIn(): boolean;
}
