const MAX_ENTRIES = 200;

const state: { isInitialized: boolean; buffer: Array<{ level: string; timestamp: string; text: string }> } = {
    isInitialized: false,
    buffer: [],
};

/**
 * Formats a single console argument into a string.
 * @param {unknown} argument - The value to format.
 * @returns {string} The formatted string representation.
 */
function formatArgument(argument: unknown): string {
    if (argument instanceof Error) return `${argument.name}: ${argument.message}\n${argument.stack ?? ''}`;
    try {
        if (typeof argument === 'object') return JSON.stringify(argument, undefined, 2);
    } catch {
        return String(argument);
    }
    return String(argument);
}

/**
 * Capture a console entry into the ring buffer.
 * @param {string} level - The log level string.
 * @param {unknown[]} originalArguments - The original console arguments.
 */
function capture(level: string, originalArguments: unknown[]): void {
    const timestamp = new Date().toISOString().slice(11, 23);
    const text = originalArguments.map(a => formatArgument(a)).join(' ');
    state.buffer.push({ level, timestamp, text });
    if (state.buffer.length > MAX_ENTRIES) state.buffer.shift();
}

/**
 * Record a failed network request into the ring buffer.
 * @param {string} method - The HTTP method used for the request.
 * @param {string} url - The requested URL.
 * @param {number | string} status - The HTTP status code or error description.
 */
export function captureNetworkError(method: string, url: string, status: number | string): void {
    capture('error', [`${method} ${url} → ${status}`]);
}

/**
 * Initialize browser log capture so the buffer mirrors the DevTools console:
 * wraps the native console methods and hooks window error events for uncaught
 * exceptions, unhandled promise rejections, failed resource loads, and CSP
 * violations. Idempotent — safe to call multiple times.
 */
export function initConsoleCapture(): void {
    if (state.isInitialized) return;
    state.isInitialized = true;

    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    const origInfo = console.info.bind(console);
    const origDebug = console.debug.bind(console);

    console.log = (...arguments_: unknown[]) => { capture('log', arguments_); origLog(...arguments_); };
    console.warn = (...arguments_: unknown[]) => { capture('warn', arguments_); origWarn(...arguments_); };
    console.error = (...arguments_: unknown[]) => { capture('error', arguments_); origError(...arguments_); };
    console.info = (...arguments_: unknown[]) => { capture('info', arguments_); origInfo(...arguments_); };
    console.debug = (...arguments_: unknown[]) => { capture('debug', arguments_); origDebug(...arguments_); };

    // `window` (not `globalThis`) is required here: the jsdom test environment
    // keeps them distinct, and these listeners must fire for `window.dispatchEvent`.
    // eslint-disable-next-line unicorn/prefer-global-this
    window.addEventListener('error', (event) => {
        const target = event.target;
        // Resource-load failures set target to an Element; window-level uncaught
        // exceptions target the Window (a WindowProxy that is not identical to
        // `window`/`globalThis` in jsdom), so discriminate via Element.
        if (target instanceof Element) {
            const element = target as { tagName?: string; src?: string; href?: string };
            capture('error', [`Failed to load resource: ${element.src ?? element.href ?? element.tagName ?? String(target)}`]);
        } else if (event.error instanceof Error) {
            capture('error', [event.error]);
        } else {
            capture('error', [`Uncaught ${event.message}`]);
        }
    }, { capture: true });

    // eslint-disable-next-line unicorn/prefer-global-this
    window.addEventListener('unhandledrejection', (event) => {
        capture('error', ['Unhandled promise rejection:', event.reason]);
    });

    // eslint-disable-next-line unicorn/prefer-global-this
    window.addEventListener('securitypolicyviolation', (event) => {
        capture('warn', [`CSP violation (${event.violatedDirective}): ${event.blockedURI}`]);
    });
}

/**
 * Get all captured console logs as a formatted string.
 * @returns {string} Newline-separated log entries with timestamps and levels.
 */
export function getFormattedConsoleLogs(): string {
    return state.buffer.map(entry => `[${entry.timestamp}] [${entry.level}] ${entry.text}`).join('\n');
}

/**
 * Clear all captured console logs from the buffer.
 */
export function clearConsoleLogs(): void {
    state.buffer = [];
}
