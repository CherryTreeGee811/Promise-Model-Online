import { routeHandler } from '../router.mjs';
import { getAccessTokenFromCookie } from '../parser.mjs';


function initGeneralLinkListeners(navContentDiv, contentDiv) {
    document.getElementById("home-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/');
        routeHandler(navContentDiv, contentDiv);
    });
}


function initAuthenticatedLinkListeners(navContentDiv, contentDiv) {
    // Do nothing for now
}


function initAnonymousLinkListeners(navContentDiv, contentDiv) {
    document.getElementById("login-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/login');
        routeHandler(navContentDiv, contentDiv);
    });
}


export function loadNavTemplate(navContentDiv, contentDiv) {
    let templateName = "anonymous.html";

    // Check if an existing token exists
    const token = getAccessTokenFromCookie();
    if (token) {
        templateName = "authenticated.html";
    }

    return fetch(`/templates/navigation/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            navContentDiv.innerHTML = html;
            initNavLinkListeners(templateName, navContentDiv, contentDiv);
            return Promise.resolve();
        })
        .catch(error => {
            navContentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            return Promise.reject(error);
        });
}


function initNavLinkListeners(templateName, navContentDiv, contentDiv) {
    initGeneralLinkListeners(navContentDiv, contentDiv);
    if (templateName === "authenticated.html") {
        initAuthenticatedLinkListeners(navContentDiv, contentDiv);
    }
    else {
        initAnonymousLinkListeners(navContentDiv, contentDiv);
    }
}