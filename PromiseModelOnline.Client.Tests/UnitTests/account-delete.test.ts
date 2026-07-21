import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = ''
        + '<form id="delete-account-form">'
        + '<input id="delete-password" type="password">'
        + '<button id="delete-account-btn" type="submit">Delete</button>'
        + '<span id="delete-btn-text"></span>'
        + '<span id="delete-spinner" class="d-none"></span>'
        + '<span id="delete-error"></span>'
        + '<span id="delete-success"></span>'
        + '</form>'
        + '<button id="export-data-btn">Export</button>'
        + '<span id="export-btn-text"></span>'
        + '<span id="export-spinner" class="d-none"></span>'
        + '<span id="export-error"></span>'
        + '<a id="export-link-top"></a>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, blob: () => Promise.resolve(new Blob()), json: () => Promise.resolve({}) });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('initDeleteAccountPage', () => {
    it('wires form submission', async () => {
        // Arrange
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({ method: 'DELETE' }));
    });

    it('wires export button', async () => {
        // Arrange
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        exportBtn.click();
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/users/me/export', expect.objectContaining({ credentials: 'include' }));
    });

    it('returns early when export-link-top is missing', async () => {
        // Arrange
        document.body.innerHTML = '<form id="delete-account-form"></form>';
        // Act
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        // Assert
        expect(() => initDeleteAccountPage()).not.toThrow();
    });

    it('returns early when required form elements are missing', async () => {
        // Arrange
        document.body.innerHTML = ''
            + '<a id="export-link-top"></a>'
            + '<button id="export-data-btn">Export</button>';
        // Act
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        // Assert
        expect(() => initDeleteAccountPage()).not.toThrow();
    });

    it('shows validation error when password is empty', async () => {
        // Arrange
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const errorElement = document.getElementById('delete-error')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(errorElement.textContent).toBe('Please enter your password.');
        expect(errorElement.classList.contains('d-none')).toBe(false);
    });

    it('shows error when delete API returns non-204/404 status', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        const errorElement = document.getElementById('delete-error')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(errorElement.textContent).toBe('Failed to delete account data. Please try again.');
        expect(errorElement.classList.contains('d-none')).toBe(false);
    });

    it('shows incorrect password error on auth 401', async () => {
        // Arrange
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve({}) })
            .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ message: 'Incorrect password' }) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        const errorElement = document.getElementById('delete-error')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(errorElement.textContent).toBe('Incorrect password. Please try again.');
        expect(errorElement.classList.contains('d-none')).toBe(false);
    });

    it('shows generic error on auth unexpected status', async () => {
        // Arrange
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve({}) })
            .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        const errorElement = document.getElementById('delete-error')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(errorElement.textContent).toBe('Something went wrong. Please try again.');
        expect(errorElement.classList.contains('d-none')).toBe(false);
    });

    it('shows network error when fetch throws on form submission', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        const errorElement = document.getElementById('delete-error')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(errorElement.textContent).toBe('Network error. Please check your connection and try again.');
        expect(errorElement.classList.contains('d-none')).toBe(false);
    });

    it('shows success message and redirects on full success path', async () => {
        // Arrange
        vi.useFakeTimers();
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        const successElement = document.getElementById('delete-success')!;
        form.dispatchEvent(new Event('submit'));
        // Act
        await vi.runAllTimersAsync();
        // Assert
        expect(successElement.textContent).toContain('permanently deleted');
        expect(successElement.classList.contains('d-none')).toBe(false);
        expect(form.classList.contains('d-none')).toBe(true);
        expect(location.assign).toHaveBeenCalledWith('/');
    });

    it('shows export error when export API responds with non-ok status', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({ message: 'Export failed' }) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        const exportError = document.getElementById('export-error')!;
        exportBtn.click();
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(exportError.textContent).toBe('Export failed');
        expect(exportError.classList.contains('d-none')).toBe(false);
    });

    it('shows fallback export error when export API response has no message', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        const exportError = document.getElementById('export-error')!;
        exportBtn.click();
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(exportError.textContent).toBe('Failed to export data.');
        expect(exportError.classList.contains('d-none')).toBe(false);
    });

    it('shows network error when export fetch throws', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        const exportError = document.getElementById('export-error')!;
        exportBtn.click();
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(exportError.textContent).toBe('Network error. Please try again.');
        expect(exportError.classList.contains('d-none')).toBe(false);
    });

    it('shows export error when JSON parsing fails', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error('parse error')) });
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        const exportError = document.getElementById('export-error')!;
        exportBtn.click();
        // Act
        await new Promise(r => setTimeout(r, 50));
        // Assert
        expect(exportError.textContent).toBe('Failed to export data.');
        expect(exportError.classList.contains('d-none')).toBe(false);
    });
});
