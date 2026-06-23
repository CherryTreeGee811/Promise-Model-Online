import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('initDeleteAccountPage', () => {
    it('wires form submission', async () => {
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const form = document.getElementById('delete-account-form') as HTMLFormElement;
        const passwordInput = document.getElementById('delete-password') as HTMLInputElement;
        passwordInput.value = 'mypassword';
        form.dispatchEvent(new Event('submit'));
        await new Promise(r => setTimeout(r, 50));
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({ method: 'DELETE' }));
    });

    it('wires export button', async () => {
        const { initDeleteAccountPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts');
        initDeleteAccountPage();
        const exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        exportBtn.click();
        await new Promise(r => setTimeout(r, 50));
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/users/me/export', expect.objectContaining({ credentials: 'include' }));
    });
});
