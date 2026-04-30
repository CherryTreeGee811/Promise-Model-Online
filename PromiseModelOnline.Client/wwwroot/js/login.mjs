import { routeHandler } from './router.mjs';
import { getToken } from './api.mjs';
import { getAccessTokenFromCookie } from './parser.mjs';


export function loadLoginForm(navContentDiv, contentDiv) {
    const loginBtn = document.getElementById("login-btn");

    loginBtn.addEventListener("click", function () {
        manageSubmission(navContentDiv, contentDiv);
    });
}


function manageSubmission(navContentDiv, contentDiv) {
    const usernameElement = document.getElementById("username-input");
    const passwordElement = document.getElementById("password-input");

    getToken(usernameElement.value, passwordElement.value)
        .then(() => {
            // Check if token exists now
            const token = getAccessTokenFromCookie();
            if (token) {
                // Reroute to home page
                window.history.pushState({}, '', '/');
                routeHandler(navContentDiv, contentDiv);
            }
        }).catch(error => {
            console.error("An error occured while trying to log in ", error);
        });
}