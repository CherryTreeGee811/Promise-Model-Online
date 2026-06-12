import { routeHandler } from './router.mjs';
import { getToken } from './api.mjs';
import { getAccessToken } from './auth-state.mjs';

export function loadLoginForm(navContentDiv, contentDiv) {
    const loginBtn = document.getElementById("login-btn");
    const registerLink = document.getElementById("login-register-link");

    // ✅ Bind login button (prevent duplicate listeners)
    if (loginBtn && !loginBtn.dataset.bound) {
        loginBtn.dataset.bound = "1";

        loginBtn.addEventListener("click", () => {
            manageSubmission(navContentDiv, contentDiv);
        });
    }

    // ✅ SPA navigation to register
    if (registerLink && !registerLink.dataset.bound) {
        registerLink.dataset.bound = "1";

        registerLink.addEventListener("click", (e) => {
            e.preventDefault();

            window.history.pushState({}, '', '/register');
            routeHandler(navContentDiv, contentDiv);
        });
    }
}

function manageSubmission(navContentDiv, contentDiv) {
    const usernameElement = document.getElementById("username-input");
    const passwordElement = document.getElementById("password-input");
    const errorContainer = document.getElementById("error-text");
    const loadingText = document.getElementById("loading-text");
    const loginBtn = document.getElementById("login-btn");

    // ✅ Reset UI
    if (errorContainer) {
        errorContainer.textContent = "";
        errorContainer.style.display = "none";
    }

    if (loadingText) {
        loadingText.textContent = "";
    }

    // ✅ Validation
    if (!usernameElement.value.trim() || !passwordElement.value) {
        errorContainer.textContent = "Username and password are required.";
        errorContainer.style.display = "block";
        return;
    }

    // ✅ Disable button + show loading
    if (loginBtn) loginBtn.disabled = true;
    if (loadingText) loadingText.textContent = "Logging in...";

    getToken(usernameElement.value, passwordElement.value)
        .then(() => {
            const token = getAccessToken();

            if (!token) {
                throw new Error("Unauthorized");
            }

            // ✅ GUARANTEE token exists BEFORE routing
            window.history.pushState({}, '', '/');
            routeHandler(navContentDiv, contentDiv);
        })
        .catch(error => {
            console.error("Login error:", error);

            const msg =
                error.message === "Unauthorized"
                    ? "Invalid username or password."
                    : "Login failed. Please try again.";

            if (errorContainer) {
                errorContainer.textContent = msg;
                errorContainer.style.display = "block";
            }

            passwordElement.value = "";
        })
        .finally(() => {
            if (loginBtn) loginBtn.disabled = false;
            if (loadingText) loadingText.textContent = "";
        });
}