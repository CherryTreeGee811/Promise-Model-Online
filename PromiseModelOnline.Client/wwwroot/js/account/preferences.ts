const TELEMETRY_KEY = 'telemetry:disabled';

/**
 * Check whether telemetry is currently disabled in local storage.
 * @returns {boolean} True if telemetry is disabled in local storage.
 */
function isTelemetryDisabled(): boolean {
    return localStorage.getItem(TELEMETRY_KEY) === 'true';
}

/** Persist the disabled state to local storage. */
function disableTelemetry(): void {
    localStorage.setItem(TELEMETRY_KEY, 'true');
}

/** Remove the disabled state from local storage (re-enabling telemetry). */
function enableTelemetry(): void {
    localStorage.removeItem(TELEMETRY_KEY);
}

/**
 * Update the status text shown beside the toggle.
 * @param {HTMLInputElement} toggle - The telemetry toggle checkbox.
 * @param {HTMLElement} statusElement - The element to show the status text in.
 */
function updateTelemetryStatus(toggle: HTMLInputElement, statusElement: HTMLElement): void {
    statusElement.textContent = toggle.checked
        ? 'Telemetry is disabled. No anonymized performance data will be sent.'
        : 'Telemetry is enabled. Anonymized performance data will be sent periodically.';
}

/** Initialise the preferences page by wiring the telemetry toggle. */
export function initPreferencesPage(): void {
    const toggle = document.querySelector<HTMLInputElement>('#telemetry-toggle');
    const statusElement = document.querySelector<HTMLElement>('#telemetry-status');
    if (!toggle || !statusElement) return;

    toggle.checked = isTelemetryDisabled();
    updateTelemetryStatus(toggle, statusElement);

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            disableTelemetry();
        } else {
            enableTelemetry();
        }
        updateTelemetryStatus(toggle, statusElement);
    });
}
