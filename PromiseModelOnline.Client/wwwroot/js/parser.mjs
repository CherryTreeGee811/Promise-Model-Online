export function getAccessTokenFromCookie() {
    const name = 'token=';
    const decodedCookies = decodeURIComponent(document.cookie);
    const cookiesArray = decodedCookies.split('; ');

    // Iterate through the cookies to find the one with the key 'token'
    for (let i = 0; i < cookiesArray.length; i++) {
        if (cookiesArray[i].startsWith(name)) {
            return cookiesArray[i].substring(name.length);
        }
    }

    return null;
}