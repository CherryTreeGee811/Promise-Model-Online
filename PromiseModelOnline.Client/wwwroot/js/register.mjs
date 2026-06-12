import { registerUser } from './api.mjs';
import { routeHandler } from './router.mjs';

export function loadRegistrationForm(navContentDiv, contentDiv) {
    const registerBtn = document.getElementById("register-btn");
    const registerLoginLink = document.getElementById("register-login-link");

    // ✅ Bind register button safely
    if (registerBtn && !registerBtn.dataset.bound) {
        registerBtn.dataset.bound = "1";

        registerBtn.addEventListener("click", () => {
            manageRegistrationSubmission(navContentDiv, contentDiv);
        });
    }

    // ✅ SPA navigation to login
    if (registerLoginLink && !registerLoginLink.dataset.bound) {
        registerLoginLink.dataset.bound = "1";

        registerLoginLink.addEventListener("click", (e) => {
            e.preventDefault();

            window.history.pushState({}, '', '/login');
            routeHandler(navContentDiv, contentDiv);
        });
    }
}

function manageRegistrationSubmission(navContentDiv, contentDiv) {
    const usernameElement = document.getElementById("username-input");
    const emailElement = document.getElementById("email-input");
    const passwordElement = document.getElementById("password-input");

    const errorContainer = document.getElementById("error-text");
    const successContainer = document.getElementById("success-text");
    const loadingText = document.getElementById("loading-text");
    const registerBtn = document.getElementById("register-btn");

    // ✅ Reset UI
    errorContainer.textContent = "";
    errorContainer.style.display = "none";

    successContainer.textContent = "";
    successContainer.style.display = "none";

    if (loadingText) loadingText.textContent = "";

    const username = usernameElement.value.trim();
    const email = emailElement.value.trim();
    const password = passwordElement.value;

    // ✅ Validation
    if (!username || !email || !password) {
        errorContainer.textContent = "All fields are required.";
        errorContainer.style.display = "block";
        return;
    }

    if (!email.includes("@")) {
        errorContainer.textContent = "Please enter a valid email address.";
        errorContainer.style.display = "block";
        return;
    }

    // ✅ Disable button + show loading
    if (registerBtn) registerBtn.disabled = true;
    if (loadingText) loadingText.textContent = "Registering...";

    registerUser(username, email, password)
        .then(() => {
            successContainer.textContent =
                "Account created successfully! Redirecting to login...";
            successContainer.style.display = "block";

            // ✅ Clear form
            usernameElement.value = "";
            emailElement.value = "";
            passwordElement.value = "";

            // ✅ Redirect
            setTimeout(() => {
                window.history.pushState({}, '', '/login');
                routeHandler(navContentDiv, contentDiv);
            }, 1500);
        })
        .catch((error) => {
            console.error("Registration error:", error);

            let errorMessage = "An error occurred during registration.";

            if (error.message) {
                errorMessage = error.message;
            } else if (error.statusCode === 409) {
                errorMessage = "Username or email already exists.";
            } else if (error.statusCode === 400) {
                errorMessage = "Invalid input.";
            }

            errorContainer.textContent = errorMessage;
            errorContainer.style.display = "block";

            passwordElement.value = "";
        })
        .finally(() => {
            if (registerBtn) registerBtn.disabled = false;
            if (loadingText) loadingText.textContent = "";
        });
}