import { changePassword } from './api.mjs';
import { routeHandler } from '../router.mjs';
import { clearTokens } from './auth-state.mjs';

export function loadChangePasswordForm(navContentDiv, contentDiv) {
    const changeBtn = document.getElementById("change-password-btn");
    if (changeBtn) {
        changeBtn.addEventListener("click", () => {
            manageChangeSubmission(navContentDiv, contentDiv);
        });
    }
}

function manageChangeSubmission(navContentDiv, contentDiv) {
    const currentElement = document.getElementById("current-password-input");
    const newElement = document.getElementById("new-password-input");
    const confirmElement = document.getElementById("confirm-password-input");
    const errorContainer = document.getElementById("error-text");
    const successContainer = document.getElementById("success-text");

    // Clear previous messages
    errorContainer.textContent = "";
    errorContainer.style.display = "none";
    successContainer.textContent = "";
    successContainer.style.display = "none";

    const currentPassword = currentElement.value;
    const newPassword = newElement.value;
    const confirmPassword = confirmElement.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorContainer.textContent = "All fields are required.";
        errorContainer.style.display = "block";
        return;
    }

    if (newPassword !== confirmPassword) {
        errorContainer.textContent = "New passwords do not match.";
        errorContainer.style.display = "block";
        newElement.value = "";
        confirmElement.value = "";
        return;
    }

    if (newPassword.length < 6) {
        errorContainer.textContent = "New password must be at least 6 characters.";
        errorContainer.style.display = "block";
        return;
    }

    changePassword(currentPassword, newPassword, confirmPassword)
        .then(() => {
            successContainer.textContent = "Password changed successfully. Signing out...";
            successContainer.style.display = "block";
            currentElement.value = "";
            newElement.value = "";
            confirmElement.value = "";

            clearTokens();

            setTimeout(() => {
                window.history.pushState({}, '', '/login');
                routeHandler(navContentDiv, contentDiv);
            }, 1200);
        })
        .catch((error) => {
            let errorMessage = "An error occurred while changing password.";
            if (error && error.message) errorMessage = error.message;
            errorContainer.textContent = errorMessage;
            errorContainer.style.display = "block";
            currentElement.value = "";
        });
}