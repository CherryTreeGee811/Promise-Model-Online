/**
 * Initialize the delete-account page with form handlers.
 */
export function initDeleteAccountPage() {
    const form = document.getElementById('delete-account-form');
    const btn = document.getElementById('delete-account-btn');
    const text = document.getElementById('delete-btn-text');
    const spinner = document.getElementById('delete-spinner');
    const errorEl = document.getElementById('delete-error');
    const successEl = document.getElementById('delete-success');
    const passwordInput = document.getElementById('delete-password');

    const exportBtn = document.getElementById('export-data-btn');
    const exportText = document.getElementById('export-btn-text');
    const exportSpinner = document.getElementById('export-spinner');
    const exportError = document.getElementById('export-error');

    const exportLinkTop = document.getElementById('export-link-top');

    exportLinkTop.addEventListener('click', (e) => {
        e.preventDefault();
        exportBtn.scrollIntoView({ behavior: 'smooth' });
        exportBtn.focus();
    });

    exportBtn.addEventListener('click', async () => {
        exportError.classList.add('d-none');
        setExportLoading(true);

        try {
            const response = await fetch('/api/users/me/export', { credentials: 'include' });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                showExportError(data.message || 'Failed to export data.');
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pmo-data-export.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            showExportError('Network error. Please try again.');
        } finally {
            setExportLoading(false);
        }
    });

    function showExportError(msg) {
        exportError.textContent = msg;
        exportError.classList.remove('d-none');
    }

    function setExportLoading(loading) {
        exportBtn.disabled = loading;
        exportText.classList.toggle('d-none', loading);
        exportSpinner.classList.toggle('d-none', !loading);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('d-none');
        successEl.classList.add('d-none');

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
                successEl.textContent = 'Your account and all associated data have been permanently deleted. You will be redirected shortly.';
                successEl.classList.remove('d-none');
                form.style.display = 'none';
                setTimeout(() => { window.location.href = '/'; }, 3000);
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

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('d-none');
    }

    function setLoading(loading) {
        btn.disabled = loading;
        text.classList.toggle('d-none', loading);
        spinner.classList.toggle('d-none', !loading);
    }
}
