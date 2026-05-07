import { registerUser } from './api.mjs';
import { routeHandler } from './router.mjs';

export function loadRegistrationForm(navContentDiv, contentDiv) {
    const registerBtn = document.getElementById("register-btn");
    const registerLoginLink = document.getElementById("register-login-link");
    
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            manageRegistrationSubmission(navContentDiv, contentDiv);
        });
    }
    
    if (registerLoginLink) {
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
    
    // Clear previous messages
    errorContainer.textContent = "";
    errorContainer.style.display = "none";
    successContainer.textContent = "";
    successContainer.style.display = "none";
    
    const username = usernameElement.value.trim();
    const email = emailElement.value.trim();
    const password = passwordElement.value;
    
    // Basic client-side validation
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
    
    registerUser(username, email, password)
        .then((response) => {
            successContainer.textContent = `Account created successfully! Redirecting to login...`;
            successContainer.style.display = "block";
            
            // Clear form
            usernameElement.value = "";
            emailElement.value = "";
            passwordElement.value = "";
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.history.pushState({}, '', '/login');
                routeHandler(navContentDiv, contentDiv);
            }, 2000);
        })
        .catch((error) => {
            let errorMessage = "An error occurred during registration.";
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.statusCode === 409) {
                errorMessage = "Username or email already exists.";
            } else if (error.statusCode === 400) {
                errorMessage = "Invalid input. Please check your entries.";
            }
            
            errorContainer.textContent = errorMessage;
            errorContainer.style.display = "block";
            passwordElement.value = "";
            
            console.error("Registration error: ", error);
        });
}