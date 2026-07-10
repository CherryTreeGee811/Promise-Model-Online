import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('initPreferencesPage', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <input type="checkbox" id="telemetry-toggle" />
            <span id="telemetry-status"></span>
        `;
    });

    it('sets toggle checked when telemetry is disabled in localStorage', async () => {
        // Arrange
        localStorage.setItem('telemetry:disabled', 'true');
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act
        initPreferencesPage();

        // Assert
        const toggle = document.querySelector('#telemetry-toggle') as HTMLInputElement;
        expect(toggle.checked).toBe(true);
    });

    it('leaves toggle unchecked when telemetry is enabled', async () => {
        // Arrange
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act
        initPreferencesPage();

        // Assert
        const toggle = document.querySelector('#telemetry-toggle') as HTMLInputElement;
        expect(toggle.checked).toBe(false);
    });

    it('shows disabled status text when toggle is checked', async () => {
        // Arrange
        localStorage.setItem('telemetry:disabled', 'true');
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act
        initPreferencesPage();

        // Assert
        const status = document.querySelector('#telemetry-status') as HTMLElement;
        expect(status.textContent).toContain('disabled');
    });

    it('shows enabled status text when toggle is unchecked', async () => {
        // Arrange
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act
        initPreferencesPage();

        // Assert
        const status = document.querySelector('#telemetry-status') as HTMLElement;
        expect(status.textContent).toContain('enabled');
    });

    it('disables telemetry on toggle check', async () => {
        // Arrange
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');
        initPreferencesPage();

        // Act
        const toggle = document.querySelector('#telemetry-toggle') as HTMLInputElement;
        toggle.click();

        // Assert
        expect(localStorage.getItem('telemetry:disabled')).toBe('true');
    });

    it('enables telemetry on toggle uncheck', async () => {
        // Arrange
        localStorage.setItem('telemetry:disabled', 'true');
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');
        initPreferencesPage();

        // Act
        const toggle = document.querySelector('#telemetry-toggle') as HTMLInputElement;
        toggle.click();

        // Assert
        expect(localStorage.getItem('telemetry:disabled')).toBeNull();
    });

    it('updates status text after toggle change', async () => {
        // Arrange
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');
        initPreferencesPage();
        const status = document.querySelector('#telemetry-status') as HTMLElement;

        // Act
        const toggle = document.querySelector('#telemetry-toggle') as HTMLInputElement;
        toggle.click();

        // Assert
        expect(status.textContent).toContain('disabled');
    });

    it('does nothing when toggle element is missing', async () => {
        // Arrange
        document.body.innerHTML = '<span id="telemetry-status"></span>';
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act & Assert
        expect(() => initPreferencesPage()).not.toThrow();
    });

    it('does nothing when status element is missing', async () => {
        // Arrange
        document.body.innerHTML = '<input type="checkbox" id="telemetry-toggle" />';
        const { initPreferencesPage } = await import('../../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts');

        // Act & Assert
        expect(() => initPreferencesPage()).not.toThrow();
    });
});
