import { changePasswordAndLogout } from "./api.mjs";

export function loadChangePasswordForm(navContentDiv, contentDiv) {
    const changeBtn = document.getElementById("change-password-btn");

    if (!changeBtn) return;

    changeBtn.addEventListener("click", () => {
        manageChangeSubmission(navContentDiv, contentDiv);
    });
}

async function manageChangeSubmission(navContentDiv, contentDiv) {
    const currentElement = document.getElementById("current-password-input");
    const newElement = document.getElementById("new-password-input");
    const confirmElement = document.getElementById("confirm-password-input");
    const errorContainer = document.getElementById("error-text");
    const successContainer = document.getElementById("success-text");

    resetMessage(errorContainer);
    resetMessage(successContainer);

    const validationError = validatePasswordChange(
        currentElement.value,
        newElement.value,
        confirmElement.value
    );

    if (validationError) {
        showMessage(errorContainer, validationError);
        return;
    }

    try {
        await changePasswordAndLogout(
            currentElement.value,
            newElement.value,
            confirmElement.value
        );

        currentElement.value = "";
        newElement.value = "";
        confirmElement.value = "";

        showMessage(successContainer, "Password changed successfully. Signing out...");

        window.setTimeout(() => {
            // Password change invalidates the current session. Use a full navigation
            // to the BFF login endpoint instead of SPA routing so cookies/OIDC state
            // are handled by the server-side auth flow.
            window.location.assign("/login");
        }, 800);
    } catch (error) {
        currentElement.value = "";
        showMessage(
            errorContainer,
            error?.message || "An error occurred while changing password."
        );
    }
}

function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
        return "All fields are required.";
    }

    if (newPassword !== confirmPassword) {
        return "New passwords do not match.";
    }

    if (newPassword.length < 6) {
        return "New password must be at least 6 characters.";
    }

    return null;
}

function resetMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.style.display = "none";
}

function showMessage(element, message) {
    if (!element) return;

    element.textContent = message;
    element.style.display = "block";
}