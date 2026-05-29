import { routeHandler } from '../router.mjs';
import { isAuthenticated } from '../api.mjs';
import { startNotificationPolling } from '../notifications/badge.mjs';

function initGeneralLinkListeners(navContentDiv, contentDiv) {
    document.getElementById("home-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/');
        routeHandler(navContentDiv, contentDiv);
    });
}

function initAuthenticatedLinkListeners(navContentDiv, contentDiv) {

    const notificationLink = document.getElementById("notifications-link");
    if (notificationLink) {
        notificationLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/notifications');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    document.getElementById("my-tasks-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/moments/my-tasks');
        routeHandler(navContentDiv, contentDiv);
    });

    // ✅ FIXED
    document.getElementById("logout-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/logout";
    });

    document.getElementById("projects-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/projects');
        routeHandler(navContentDiv, contentDiv);
    });

    const changeLink = document.getElementById("change-password-link");
    if (changeLink) {
        changeLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/change-password');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    const invLink = document.getElementById("invitations-link");
    if (invLink) {
        invLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/invitations');
            routeHandler(navContentDiv, contentDiv);
        });
    }
}

export async function loadNavTemplate(navContentDiv, contentDiv) {

    let templateName = "anonymous.html";

    const auth = await isAuthenticated();
    if (auth) {
        templateName = "authenticated.html";
    }

    return fetch(`/templates/navigation/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            navContentDiv.innerHTML = html;

            if (auth) {
                startNotificationPolling();
            }

            initNavLinkListeners(templateName, navContentDiv, contentDiv);
        })
        .catch(error => {
            navContentDiv.innerHTML =
                `<h1>Error loading template</h1><p>${error.message}</p>`;
        });
}

function initNavLinkListeners(templateName, navContentDiv, contentDiv) {
    initGeneralLinkListeners(navContentDiv, contentDiv);

    if (templateName === "authenticated.html") {
        initAuthenticatedLinkListeners(navContentDiv, contentDiv);
    }
}