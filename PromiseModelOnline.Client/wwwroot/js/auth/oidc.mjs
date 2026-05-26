import { setTokens, getAccessToken, clearTokens } from './auth-state.mjs';
import { AUTH_BASE } from '../config.mjs';

// ===============================
// CONFIG
// ===============================

const config = {
    clientId:    "pmo-spa",
    redirectUri: `${window.location.origin}/auth/callback`,
    authority:   AUTH_BASE,
    scope:       "openid profile email offline_access projects.read projects.write"
};

// ===============================
// PKCE UTILITIES
// ===============================

function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(verifier);
    const hash    = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(bytes) {
    return btoa(String.fromCharCode(...bytes))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// ===============================
// LOGIN
// ===============================

export async function login() {
    const codeVerifier   = generateCodeVerifier();
    const codeChallenge  = await generateCodeChallenge(codeVerifier);
    const state          = crypto.randomUUID();
    const nonce          = crypto.randomUUID();

    sessionStorage.setItem("oidc_code_verifier", codeVerifier);
    sessionStorage.setItem("oidc_state",          state);
    sessionStorage.setItem("oidc_nonce",           nonce);
    sessionStorage.setItem("oidc_return_url",      window.location.pathname);

    const params = new URLSearchParams({
        response_type:         "code",
        client_id:             config.clientId,
        redirect_uri:          config.redirectUri,
        scope:                 config.scope,
        state,
        nonce,
        code_challenge:        codeChallenge,
        code_challenge_method: "S256"
    });

    window.location.href = `${config.authority}/authorize?${params.toString()}`;
}

// ===============================
// CALLBACK HANDLER
// ===============================

export async function handleCallback() {
    const params = new URLSearchParams(window.location.search);

    const code  = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) throw new Error(`OAuth error: ${error}`);

    const storedState   = sessionStorage.getItem("oidc_state");
    const codeVerifier  = sessionStorage.getItem("oidc_code_verifier");
    const storedNonce   = sessionStorage.getItem("oidc_nonce");

    if (state !== storedState)   throw new Error("State mismatch — possible CSRF");
    if (!code || !codeVerifier)  throw new Error("Missing code or verifier");

    // Exchange the authorization code for tokens.
    // The server will return access_token + id_token in the body.
    // The refresh_token is NOT in the response body — the server has set it
    // as an HttpOnly cookie (__Secure-refresh) that JavaScript cannot read.
    const tokenResponse = await fetch(`${config.authority}/token`, {
        method:      "POST",
        credentials: "include",  // required so the browser sends/receives cookies
        headers:     { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type:    "authorization_code",
            client_id:     config.clientId,
            code,
            redirect_uri:  config.redirectUri,
            code_verifier: codeVerifier
        })
    });

    if (!tokenResponse.ok) {
        const err = await tokenResponse.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${err.error_description ?? tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    // Validate nonce (OIDC requirement).
    // Two separate try/catch blocks so a parse failure and a nonce mismatch
    // produce distinct, actionable error messages.
    if (tokens.id_token && storedNonce) {
        let payload;
        try {
            payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        } catch {
            throw new Error("id_token is malformed and could not be decoded");
        }

        if (payload.nonce !== storedNonce) {
            throw new Error("Nonce mismatch in id_token — possible replay attack");
        }
    }

    // Store only the access token in memory.
    // The refresh token is an HttpOnly cookie — it never enters JS memory.
    setTokens(tokens.access_token);
    sessionStorage.setItem("id_token", tokens.id_token ?? "");

    // Clean up ephemeral PKCE / state values
    sessionStorage.removeItem("oidc_code_verifier");
    sessionStorage.removeItem("oidc_state");
    sessionStorage.removeItem("oidc_nonce");

    const returnUrl = sessionStorage.getItem("oidc_return_url") || "/";
    sessionStorage.removeItem("oidc_return_url");

    window.location.href = returnUrl;
}

// ===============================
// SILENT REFRESH
// ===============================

export async function tryRefresh() {
    // The refresh token is in the __Secure-refresh HttpOnly cookie.
    // credentials: "include" tells the browser to attach it automatically.
    // We deliberately do NOT include a refresh_token field in the body —
    // TokenCookieMiddleware on the auth server reads the cookie and injects
    // it into the form before OpenIddict processes the request.
    const response = await fetch(`${config.authority}/token`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id:  config.clientId
        })
    });

    if (!response.ok) {
        // The server cleared the stale cookie on failure.
        // Clear the in-memory access token to force a full re-login.
        clearTokens();
        return false;
    }

    const tokens = await response.json();

    // The server issued a new refresh token and rotated the cookie automatically
    // (rolling refresh tokens, UseRollingRefreshTokens in Program.cs).
    // We only need to update the in-memory access token.
    setTokens(tokens.access_token);
    return true;
}

// ===============================
// LOGOUT
// ===============================

export function logout() {
    const idTokenHint = sessionStorage.getItem("id_token") ?? "";

    clearTokens();
    sessionStorage.removeItem("id_token");

    // The auth server's TokenCookieMiddleware will delete the __Secure-refresh
    // cookie when it sees the request hit /connect/logout.
    const params = new URLSearchParams({
        post_logout_redirect_uri: window.location.origin,
        id_token_hint:            idTokenHint
    });

    window.location.href = `${config.authority}/logout?${params.toString()}`;
}

// ===============================
// USER INFO
// ===============================

export async function getUserInfo() {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${config.authority}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch user info");

    return res.json();
}
