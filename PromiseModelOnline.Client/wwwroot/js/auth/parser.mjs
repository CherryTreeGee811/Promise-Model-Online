function base64UrlDecode(str) {
    // Replace non-url compatible chars with base64 standard chars
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with trailing '='
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

// Extract the role from the JWT token
export function getRoleFromToken(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        // Try both standard and Microsoft claim types
        return (
            payload['role'] ||
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            null
        );
    } catch (e) {
        return null;
    }
}

// Extract the user name from the JWT token
export function getNameFromToken(token) {
    if (!token) return null;

    try {
        const payload = JSON.parse(
            atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        return payload.name || payload.sub || null;
    } catch {
        return null;
    }
}