import { navigate, loadTemplate } from "../router.mjs";
import { isAuthenticated } from "../api.mjs";
import { logout } from "../auth/api.mjs";
import { startNotificationPolling } from "../notifications/badge.mjs";

function bindRouteLink(id, path, navContentDiv, contentDiv) {
    document.getElementById(id)?.addEventListener("click", (event) => {
        event.preventDefault();
        navigate(path, navContentDiv, contentDiv);
    });
}

function initGeneralLinkListeners(navContentDiv, contentDiv) {
    bindRouteLink("home-link", "/", navContentDiv, contentDiv);
}

function initAuthenticatedLinkListeners(navContentDiv, contentDiv) {
    bindRouteLink("notifications-link", "/notifications", navContentDiv, contentDiv);
    bindRouteLink("my-tasks-link", "/moments/my-tasks", navContentDiv, contentDiv);
    bindRouteLink("projects-link", "/projects", navContentDiv, contentDiv);
    bindRouteLink("change-password-link", "/change-password", navContentDiv, contentDiv);
    bindRouteLink("invitations-link", "/invitations", navContentDiv, contentDiv);
    bindRouteLink("knowledge-base-link", "/knowledge-base", navContentDiv, contentDiv);

    document.getElementById("logout-link")?.addEventListener("click", async (event) => {
        event.preventDefault();

        await logout();
        navigate("/", navContentDiv, contentDiv);
    });
}

export async function loadNavTemplate(navContentDiv, contentDiv) {
    const auth = await isAuthenticated();
    const templateName = auth ? "authenticated.html" : "anonymous.html";

    try {
        await loadTemplate(`navigation/${templateName}`, navContentDiv);

        initGeneralLinkListeners(navContentDiv, contentDiv);

        if (auth) {
            startNotificationPolling();
            initAuthenticatedLinkListeners(navContentDiv, contentDiv);
        }
    } catch (error) {
        navContentDiv.innerHTML = `
            <li class="main-menu-item">
                <span class="main-menu-link">Navigation unavailable</span>
            </li>
        `;

        console.error("Failed to load navigation template:", error);
    }
}