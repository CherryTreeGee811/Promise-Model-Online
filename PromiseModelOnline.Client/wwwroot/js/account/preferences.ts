const TELEMETRY_KEY = 'telemetry:disabled';

function getTelemetryDisabled(): boolean {
    return localStorage.getItem(TELEMETRY_KEY) === 'true';
}

function setTelemetryDisabled(disabled: boolean): void {
    if (disabled) {
        localStorage.setItem(TELEMETRY_KEY, 'true');
    } else {
        localStorage.removeItem(TELEMETRY_KEY);
    }
}

function updateTelemetryStatus(toggle: HTMLInputElement, statusEl: HTMLElement): void {
    if (toggle.checked) {
        statusEl.textContent = 'Telemetry is disabled. No anonymized performance data will be sent.';
    } else {
        statusEl.textContent = 'Telemetry is enabled. Anonymized performance data will be sent periodically.';
    }
}

export function initPreferencesPage(): void {
    const toggle = document.querySelector<HTMLInputElement>('#telemetry-toggle');
    const statusEl = document.querySelector<HTMLElement>('#telemetry-status');
    if (!toggle || !statusEl) return;

    toggle.checked = getTelemetryDisabled();
    updateTelemetryStatus(toggle, statusEl);

    toggle.addEventListener('change', () => {
        setTelemetryDisabled(toggle.checked);
        updateTelemetryStatus(toggle, statusEl);
    });
}
