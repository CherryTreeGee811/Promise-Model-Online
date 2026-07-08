/**
 * Initialize the delete-account page with form handlers.
 */
export function initDeleteAccountPage() {
    const form = document.querySelector('#delete-account-form') as HTMLFormElement;
    const button = document.querySelector('#delete-account-btn') as HTMLButtonElement;
    const text = document.querySelector('#delete-btn-text') as HTMLElement;
    const spinner = document.querySelector('#delete-spinner') as HTMLElement;
    const errorElement = document.querySelector('#delete-error') as HTMLElement;
    const successElement = document.querySelector('#delete-success') as HTMLElement;
    const passwordInput = document.querySelector('#delete-password') as HTMLInputElement;

    const exportButton = document.querySelector('#export-data-btn') as HTMLButtonElement;
    const exportText = document.querySelector('#export-btn-text') as HTMLElement;
    const exportSpinner = document.querySelector('#export-spinner') as HTMLElement;
    const exportError = document.querySelector('#export-error') as HTMLElement;

    const exportLinkTop = document.querySelector('#export-link-top') as HTMLElement;

    if (!exportLinkTop || !exportButton) return;

    exportLinkTop.addEventListener('click', (event) => {
        event.preventDefault();
        exportButton.scrollIntoView({ behavior: 'smooth' });
        exportButton.focus();
    });

    exportButton.addEventListener('click', async () => {
        if (exportError) exportError.classList.add('d-none');
        setExportLoading(true);

        try {
            const response = await fetch('/api/users/me/export', { credentials: 'include' });
            if (!response.ok) {
                let data;
            try {
                data = await response.json();
            } catch {
                data = {};
            }
                showExportError(data.message || 'Failed to export data.');
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pmo-data-export.json';
            document.body.append(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            showExportError('Network error. Please try again.');
        } finally {
            setExportLoading(false);
        }
    });

    /**
     * Display an export error message in the export error element.
     * @param {string} message - The error message to display.
     */
    function showExportError(message: string) {
        if (!exportError) return;
        exportError.textContent = message;
        exportError.classList.remove('d-none');
    }

    /**
     * Toggle the loading state of the export button.
     * @param {boolean} isLoading - Whether the export operation is in progress.
     */
    function setExportLoading(isLoading: boolean) {
        if (!exportButton || !exportText || !exportSpinner) return;
        exportButton.disabled = isLoading;
        exportText.classList.toggle('d-none', isLoading);
        exportSpinner.classList.toggle('d-none', !isLoading);
    }

    if (!form || !errorElement || !successElement || !passwordInput || !button || !text || !spinner) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorElement.classList.add('d-none');
        successElement.classList.add('d-none');

        const password = passwordInput.value.trim();
        if (!password) {
            showError('Please enter your password.');
            return;
        }

        setLoading(true);

        try {
            const apiResponse = await fetch('/api/users/me', {
                method: 'DELETE',
                credentials: 'include',
            });

            if (apiResponse.status !== 204 && apiResponse.status !== 404) {
                showError('Failed to delete account data. Please try again.');
                setLoading(false);
                return;
            }

            const authResponse = await fetch('/account/me', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include',
            });

                if (authResponse.status === 204) {
                    showDeleteSuccess();

                    /** Shows a permanent success message after account deletion. */
                    function showDeleteSuccess(): void {
                        successElement.textContent = 'Your account and all associated data have been permanently deleted. You will be redirected shortly.';
                        successElement.classList.remove('d-none');
                        form.classList.add('d-none');
                        setTimeout(() => { location.assign('/'); }, 3000);
                    }
            } else if (authResponse.status === 401) {
                showError('Incorrect password. Please try again.');
            } else {
                showError('Something went wrong. Please try again.');
            }
        } catch {
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    });

    /**
     * Display a form error message in the delete-error element.
     * @param {string} message - The error message to display.
     */
    function showError(message: string) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }

    /**
     * Toggle the loading state of the delete-account button.
     * @param {boolean} isLoading - Whether the delete operation is in progress.
     */
    function setLoading(isLoading: boolean) {
        button.disabled = isLoading;
        text.classList.toggle('d-none', isLoading);
        spinner.classList.toggle('d-none', !isLoading);
    }
}
