import { loadHomePage } from './home.mjs';
import { loadNavTemplate } from './navigation/router.mjs';
import { loadLoginForm } from './login.mjs';
import { loadRegistrationForm } from './register.mjs';
import { loadChangePasswordForm } from './change-password.mjs';
import { deleteTokenCookies, getRefreshTokenFromCookie, getAccessTokenFromCookie } from './parser.mjs';
import { requestLogout } from './api.mjs';

/**
 * Initializes the application when the DOM is fully loaded.
 * 
 * This function sets up the main content area, initializes event listeners for 
 * navigation links, and handles routing based on the current URL path. It also 
 * loads the appropriate templates and data.
 * 
 * @function
 * @returns {void} This function does not return a value.
 */
document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
    const navContentDiv = document.getElementById("main-menu");

    // Handle browser back/forward navigation
    window.addEventListener("popstate", routeHandler);

    // Initial route handling
    routeHandler(navContentDiv, contentDiv);
});


/**
* Loads an HTML template and updates the specified contentDiv with the fetched content.
* 
* This function fetches the specified template from the server and updates the 
* inner HTML of the provided contentDiv. If the fetch operation fails, it displays 
* an error message in the contentDiv.
* 
* @function loadTemplate
* @param {string} templateName - The name of the template file to load.
* @param {HTMLElement} contentDiv - The HTML element where the template will be loaded.
* @returns {void} This function does not return a value.
* 
* @example
* // Load the home template into the contentDiv
* loadTemplate("home.html", contentDiv);
*/
export function loadTemplate(templateName, contentDiv) {
    return fetch(`/templates/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = html;
            return Promise.resolve();
        })
        .catch(error => {
            contentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            return Promise.reject(error);
        });
}


/**
* Handles routing based on the current URL path.
* 
* This function determines which template to load and which data to fetch based 
* on the current URL path. It updates the contentDiv with the appropriate template 
* and data.
* 
* @function routeHandler
* @returns {void} This function does not return a value.
*/
export function routeHandler(navContentDiv, contentDiv) {
    let path = window.location.pathname;
    
    // Handle logout
    if (path === '/logout') {
        const refreshToken = getRefreshTokenFromCookie();
        if (refreshToken) {
            requestLogout(refreshToken)
                .then(() => {
                    deleteTokenCookies();
                    window.history.replaceState({}, '', '/');
                    path = '/';
                    loadNavTemplate(navContentDiv, contentDiv);
                    loadTemplate("home.html", contentDiv).then(() => {
                        return loadHomePage();
                    });
                })
                .catch((error) => {
                    console.error('Logout failed:', error);
                    // Still clear cookies and redirect even if API call fails
                    deleteTokenCookies();
                    window.history.replaceState({}, '', '/');
                    path = '/';
                    loadNavTemplate(navContentDiv, contentDiv);
                    loadTemplate("home.html", contentDiv).then(() => {
                        return loadHomePage();
                    });
                });
        } else {
            // No refresh token, just redirect
            deleteTokenCookies();
            window.history.replaceState({}, '', '/');
            path = '/';
            loadNavTemplate(navContentDiv, contentDiv);
            loadTemplate("home.html", contentDiv).then(() => {
                return loadHomePage();
            });
        }
        return;
    }
    
    loadNavTemplate(navContentDiv, contentDiv);

    switch (true) {
        case path == '/':
            loadTemplate("home.html", contentDiv).then(() => {
                return loadHomePage();
            });
            break;
        case path == '/login':
            loadTemplate("login.html", contentDiv).then(() => {
                return loadLoginForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading login form js:', error);
            });
            break;
        case path == '/projects':
            loadTemplate("authenticated/projects.html", contentDiv).then(() => {
                return loadProjectListPage(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading project list js:', error);
            });
            break;
        case path == '/register':
            loadTemplate("register.html", contentDiv).then(() => {
                return loadRegistrationForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading registration form js:', error);
            });
            break;
        case path == '/change-password':
            // Protect route: require authentication
            if (!getAccessTokenFromCookie()) {
                window.history.pushState({}, '', '/login');
                loadNavTemplate(navContentDiv, contentDiv);
                loadTemplate("login.html", contentDiv).then(() => {
                    return loadLoginForm(navContentDiv, contentDiv);
                });
                break;
            }

            loadTemplate("change-password.html", contentDiv).then(() => {
                return loadChangePasswordForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading change password form js:', error);
            });
            break;
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
    }
}