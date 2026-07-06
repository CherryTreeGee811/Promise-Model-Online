/**
 * @file Privacy-first performance and health telemetry.
 *
 * GDPR / PIPEDA compliant:
 *   - No PII collected (no user IDs, emails, IPs, tokens, or text content)
 *   - No cookies or persistent storage
 *   - Respects Global Privacy Control (GPC) signal
 *   - Opt-out via `<meta name="telemetry" content="off">`
 *   - Error messages only — stack traces stripped (may contain user data)
 *   - Paths anonymized: project slugs replaced with `:owner/:project`
 *   - Best-effort delivery via sendBeacon, no retry queue
 *   - Metrics are aggregated client-side; no individual event tracking
 */

interface TelemetryPayload {
  heapSize: number;
  domNodes: number;
  errorCount: number;
  errorMessages: string[];
  longTaskCount: number;
  swState: string;
  pathPattern: string;
  sentAt: number;
}

interface TelemetryState {
  intervalId: ReturnType<typeof setInterval> | undefined;
  errorMessages: string[];
  longTaskCount: number;
}

const SAMPLE_INTERVAL_MS = 60_000;
const MAX_ERRORS = 20;
const LONG_TASK_THRESHOLD_MS = 50;
const knownAccountPaths = new Set(['pmo_test', 'account', 'moments', 'knowledge-base', 'projects', 'privacy', 'tos']);

const state: TelemetryState = {
  intervalId: undefined,
  errorMessages: [],
  longTaskCount: 0,
};

/**
 * Check whether the user has opted out via GPC signal, meta tag, or localStorage preference.
 * @returns {boolean} True if telemetry should be disabled.
 */
function isOptedOut(): boolean {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('telemetry:disabled') === 'true') return true;
  if ('globalPrivacyControl' in navigator && (navigator as Record<string, unknown>).globalPrivacyControl) {
    return true;
  }
  const meta = document.querySelector('meta[name="telemetry"]');
  return meta?.getAttribute('content') === 'off';
}

/**
 * Anonymize a URL path by replacing known identifiers with placeholders.
 * @param {string} path - The full URL pathname.
 * @returns {string} The anonymized path pattern.
 */
export function anonymizePath(path: string): string {
  const segments = path.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
  return '/' + segments.map(s => {
    if (knownAccountPaths.has(s)) return s;
    if (/^[a-f0-9-]{36}$/i.test(s)) return ':id';
    if (/^[a-z0-9-]{2,64}$/i.test(s) && segments.indexOf(s) === 0) return ':owner';
    if (/^[a-z0-9-]{2,64}$/i.test(s) && segments.indexOf(s) === 1) return ':project';
    return s;
  }).join('/');
}

/**
 * Collect current metrics for a telemetry payload.
 * @returns {TelemetryPayload} The metrics payload.
 */
function collectMetrics(): TelemetryPayload {
  const memoryInfo = 'memory' in performance ? (performance as unknown as { memory: Record<string, number> }).memory : undefined;
  const heapSize = memoryInfo?.usedJSHeapSize ?? 0;
  const capturedMessages = state.errorMessages;
  state.errorMessages = [];
  const errorCount = capturedMessages.length;

  return {
    heapSize,
    domNodes: document.querySelectorAll('*').length,
    errorCount,
    errorMessages: capturedMessages.slice(0, MAX_ERRORS),
    longTaskCount: state.longTaskCount,
    swState: navigator.serviceWorker?.controller?.state ?? 'none',
    pathPattern: anonymizePath(location.pathname),
    sentAt: Date.now(),
  };
}

/**
 * Send the current telemetry payload to the server via sendBeacon.
 */
function sendTelemetry(): void {
  if (isOptedOut()) return;
  const payload = collectMetrics();
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/umami/api/telemetry', blob);
  } catch {
    // Best-effort; never throw
  }
}

/**
 * Set up a PerformanceObserver to count long tasks.
 * Guards against unsupported entry types to avoid console warnings in Firefox/WebKit.
 */
function observeLongTasks(): void {
  if (typeof PerformanceObserver === 'undefined') return;
  if (!('supportedEntryTypes' in PerformanceObserver)) return;
  const entryTypes = PerformanceObserver.supportedEntryTypes as unknown[];
  if (!Array.isArray(entryTypes) || !entryTypes.includes('longtask')) return;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > LONG_TASK_THRESHOLD_MS) {
        state.longTaskCount++;
      }
    }
  });
  observer.observe({ type: 'longtask', buffered: false });
}

/**
 * Listen for runtime errors and unhandled promise rejections.
 */
function captureErrors(): void {
  addEventListener('error', (event: ErrorEvent) => {
    if (state.errorMessages.length >= MAX_ERRORS) return;
    state.errorMessages.push(event.message.slice(0, 200));
  });

  addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (state.errorMessages.length >= MAX_ERRORS) return;
    const reason = event.reason;
    const message = (reason instanceof Error ? reason.message : String(reason)).slice(0, 200);
    state.errorMessages.push(message);
  });
}

/**
 * Start telemetry collection.
 * Safe to call multiple times — will not start twice.
 */
export function initTelemetry(): void {
  if (state.intervalId) return;
  if (isOptedOut()) return;

  observeLongTasks();
  captureErrors();
  sendTelemetry();
  state.intervalId = setInterval(sendTelemetry, SAMPLE_INTERVAL_MS);
}


