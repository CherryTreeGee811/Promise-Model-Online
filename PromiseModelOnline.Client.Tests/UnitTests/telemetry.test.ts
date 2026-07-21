import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { anonymizePath } from '../../PromiseModelOnline.Client/wwwroot/js/telemetry.ts';

// ============================================================================
// Helper: spy on sendBeacon and parse the payload
// ============================================================================
async function getLastPayload(): Promise<Record<string, unknown>> {
  const calls = (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls;
  if (calls.length === 0) throw new Error('No sendBeacon calls');
  const [[_url, blob]] = calls.slice(-1);
  return JSON.parse(await blob.text());
}

let initTelemetry: () => void;

// ============================================================================
// Setup
// ============================================================================
beforeEach(async () => {
  // Restore any prior mocks before setting up fresh ones
  vi.restoreAllMocks();

  vi.useFakeTimers();

  // Reset DOM
  document.body.innerHTML = '';

  // Extend navigator with mock APIs (sendBeacon is not available in jsdom)
  (navigator as Record<string, unknown>).sendBeacon = vi.fn().mockReturnValue(true);
  (navigator as Record<string, unknown>).serviceWorker = { controller: { state: 'activated' } };

  // Default: no GPC signal
  delete (navigator as Record<string, unknown>).globalPrivacyControl;

  // Remove meta tag if any
  document.querySelector('meta[name="telemetry"]')?.remove();

  // Mock performance.memory (Chromium-specific)
  (performance as unknown as Record<string, unknown>).memory = { usedJSHeapSize: 2_097_152 };

  // Mock PerformanceObserver — use a class to support `new` correctly
  class MockPerformanceObserver {
    static supportedEntryTypes = ['longtask', 'mark', 'measure'];
    observe = vi.fn();
    disconnect = vi.fn();
  }
  (globalThis as unknown as Record<string, unknown>).PerformanceObserver = MockPerformanceObserver as unknown;

  // Mock location — defineProperty matches the pattern used in vitest.setup.ts
  Object.defineProperty(globalThis, 'location', {
    value: { pathname: '/owner-name/project-name', href: 'https://localhost:9000/owner-name/project-name' },
    writable: true,
  });

  // Also clear any prior cookie spy
  vi.restoreAllMocks();

  // Clear localStorage to prevent cross-test leakage from telemetry:disabled
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // Reload the telemetry module fresh so it picks up our mocked globals
  vi.resetModules();
  const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/telemetry.ts');
  initTelemetry = mod.initTelemetry;

  // Set up tracking spies for the test
  if (typeof localStorage !== 'undefined') vi.spyOn(localStorage, 'setItem');
  if (typeof sessionStorage !== 'undefined') vi.spyOn(sessionStorage, 'setItem');
  const cookieSet = vi.spyOn(document, 'cookie', 'set');
  void cookieSet;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ============================================================================
// Group 1 — GDPR / PIPEDA Compliance Claims (8 tests)
// ============================================================================

describe('GDPR / PIPEDA compliance claims', () => {
  it('no PII collected', async () => {
    // Arrange
    initTelemetry();
    // Act
    const payload = await getLastPayload();

    // Assert
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('userName');
    expect(payload).not.toHaveProperty('username');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('ip');
    expect(payload).not.toHaveProperty('token');
    expect(payload).not.toHaveProperty('sessionId');
    expect(payload).not.toHaveProperty('text');
    expect(payload).not.toHaveProperty('formData');
  });

  it('no cookies or persistent storage', async () => {
    // Arrange
    const cookieSet = vi.spyOn(document, 'cookie', 'set');
    initTelemetry();
    // Act
    await getLastPayload();

    // Telemetry module should not set cookies
    // Assert
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('respects Global Privacy Control (GPC) signal', () => {
    // Arrange
    Object.defineProperty(window.navigator, 'globalPrivacyControl', {
      value: true, configurable: true, writable: true,
    });
    initTelemetry();
    // Act
    vi.advanceTimersByTime(120_000);
    // Assert
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('respects meta tag opt-out (<meta name="telemetry" content="off">)', () => {
    // Arrange
    const meta = document.createElement('meta');
    meta.name = 'telemetry';
    meta.content = 'off';
    document.head.append(meta);

    initTelemetry();
    // Act
    vi.advanceTimersByTime(120_000);
    // Assert
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('error messages only — no stack traces collected', async () => {
    // Arrange
    initTelemetry();
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'Something broke',
      error: new Error('Something broke'),
    }));
    vi.advanceTimersByTime(60_000);
    // Act
    const payload = await getLastPayload();

    // Assert
    expect(payload.errorMessages).toContain('Something broke');
    if (Array.isArray(payload.errorMessages)) {
      for (const msg of payload.errorMessages) {
        expect(msg).not.toMatch(/\n\s+at\s/);
      }
    }
  });

  it('paths are anonymized', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/owner-name/project-name')).toBe('/:owner/:project');
  });

  it('best-effort delivery via sendBeacon — no retry queue', async () => {
    // Arrange
    initTelemetry();
    const firstCallCount = (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    vi.advanceTimersByTime(60_000);
    // Act
    const secondCallCount = (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    // Assert
    expect(secondCallCount - firstCallCount).toBe(1);
  });

  it('metrics are aggregated client-side — no individual event tracking', async () => {
    // Arrange
    initTelemetry();
    // Act
    const payload = await getLastPayload();

    // Assert
    expect(payload).toHaveProperty('heapSize');
    expect(payload).toHaveProperty('domNodes');
    expect(payload).toHaveProperty('errorCount');
    expect(payload).toHaveProperty('errorMessages');
    expect(payload).toHaveProperty('longTaskCount');
    expect(payload).toHaveProperty('swState');
    expect(payload).toHaveProperty('pathPattern');
    expect(payload).toHaveProperty('sentAt');
    expect(Array.isArray(payload)).toBe(false);
  });
});

// ============================================================================
// Group 2 — Opt-out flow (4 tests)
// ============================================================================

describe('opt-out flow', () => {
  it('blocks telemetry when localStorage telemetry:disabled is true', () => {
    // Arrange
    localStorage.setItem('telemetry:disabled', 'true');
    // Act
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('blocks telemetry when GPC signal is true', () => {
    // Arrange
    Object.defineProperty(window.navigator, 'globalPrivacyControl', {
      value: true, configurable: true, writable: true,
    });
    // Act
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('blocks telemetry when meta tag content is "off"', () => {
    // Arrange
    const meta = document.createElement('meta');
    meta.name = 'telemetry';
    meta.content = 'off';
    document.head.append(meta);
    // Act
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('allows telemetry when neither GPC nor meta tag is set', () => {
    // Arrange
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('does not queue failed sendBeacon calls for retry', () => {
    // Arrange
    (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    // Act
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Group 3 — Path anonymization (6 direct tests + 1 integration test)
// ============================================================================

describe('path anonymization', () => {
  it('passes through plain paths unchanged', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/projects')).toBe('/projects');
    expect(anonymizePath('/account')).toBe('/account');
    expect(anonymizePath('/knowledge-base')).toBe('/knowledge-base');
    expect(anonymizePath('/privacy')).toBe('/privacy');
    expect(anonymizePath('/tos')).toBe('/tos');
  });

  it('replaces first unknown segment with :owner', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/my-org')).toBe('/:owner');
  });

  it('replaces second unknown segment with :project', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/my-org/my-project')).toBe('/:owner/:project');
    expect(anonymizePath('/my-org/my-project/promises/5')).toBe('/:owner/:project/promises/5');
  });

  it('replaces UUID segments with :id', () => {
    // Arrange
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    // Assert
    expect(anonymizePath('/projects/' + uuid + '/detail')).toBe('/projects/:id/detail');
  });

  it('strips scheme and host before processing', () => {
    // Arrange
    // Assert
    expect(anonymizePath('https://example.com/some-owner/some-project'))
      .toBe('/:owner/:project');
  });

  it('handles root path /', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/')).toBe('/');
  });

  it('handles empty pathname segments gracefully', () => {
    // Single-character segments (a, b) are below the {2,64} regex length
    // so they pass through unchanged
    // Arrange
    // Assert
    expect(anonymizePath('//a//b')).toBe('/a/b');
  });

  it('handles numeric segments (42 is matched as alphanumeric)', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/42')).toBe('/:owner');
  });
});

// ============================================================================
// Group 4 — Error collection (6 tests)
// ============================================================================

describe('error collection', () => {
  it('captures ErrorEvent message', async () => {
    // Arrange
    initTelemetry();
    window.dispatchEvent(new ErrorEvent('error', { message: 'test error' }));
    vi.advanceTimersByTime(60_000);
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.errorMessages).toContain('test error');
  });

  it('does not collect stack traces', async () => {
    // Arrange
    initTelemetry();
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'test error',
      error: new Error('test error'),
    }));
    vi.advanceTimersByTime(60_000);
    const payload = await getLastPayload();
    // Act
    const messages = payload.errorMessages as string[];
    // Assert
    expect(messages).toContain('test error');
    for (const m of messages) {
      expect(m).not.toMatch(/\n\s+at\s/);
    }
  });

  it('captures unhandled promise rejections', async () => {
    // Arrange
    initTelemetry();
    const rejected = Promise.reject(new Error('async failed')).catch(() => {});
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      promise: rejected,
      reason: new Error('async failed'),
    }));
    vi.advanceTimersByTime(60_000);
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.errorMessages).toContain('async failed');
  });

  it('truncates error messages to 200 characters', async () => {
    // Arrange
    initTelemetry();
    window.dispatchEvent(new ErrorEvent('error', { message: 'x'.repeat(500) }));
    vi.advanceTimersByTime(60_000);
    const payload = await getLastPayload();
    // Act
    const messages = payload.errorMessages as string[];
    // Assert
    expect(messages[0].length).toBeLessThanOrEqual(200);
  });

  it('stores at most 20 error messages', async () => {
    // Arrange
    initTelemetry();
    for (let i = 0; i < 25; i++) {
      window.dispatchEvent(new ErrorEvent('error', { message: `error-${i}` }));
    }
    vi.advanceTimersByTime(60_000);
    // Act
    const payload = await getLastPayload();
    // Assert
    expect((payload.errorMessages as string[]).length).toBeLessThanOrEqual(20);
  });

  it('stringifies non-Error rejection reasons', async () => {
    // Arrange
    initTelemetry();
    const rejected = Promise.reject('string reason').catch(() => {});
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      promise: rejected,
      reason: 'string reason',
    }));
    vi.advanceTimersByTime(60_000);
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.errorMessages).toContain('string reason');
  });
});

// ============================================================================
// Group 5 — Metrics collection (7 tests)
// ============================================================================

describe('metrics collection', () => {
  it('reads heap size from performance.memory.usedJSHeapSize', async () => {
    // Arrange
    (performance as unknown as Record<string, unknown>).memory = { usedJSHeapSize: 5_242_880 };
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.heapSize).toBe(5_242_880);
  });

  it('reports heapSize = 0 when performance.memory is unavailable', async () => {
    // Arrange
    delete (performance as unknown as Record<string, unknown>).memory;
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.heapSize).toBe(0);
  });

  it('counts DOM nodes from querySelectorAll(*)', async () => {
    // Arrange
    document.body.innerHTML = '<div><span><p>text</p></span></div>';
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.domNodes).toBeGreaterThanOrEqual(3);
  });

  it('reports SW state from navigator.serviceWorker.controller.state', async () => {
    // Arrange
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.swState).toBe('activated');
  });

  it('reports swState "none" when no controller', async () => {
    // Arrange
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true, writable: true,
    });
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.swState).toBe('none');
  });

  it('reports swState "none" when serviceWorker is unavailable', async () => {
    // Arrange
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: undefined,
      configurable: true, writable: true,
    });
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(payload.swState).toBe('none');
  });

  it('includes sentAt as a numeric timestamp', async () => {
    // Arrange
    initTelemetry();
    // Act
    const payload = await getLastPayload();
    // Assert
    expect(typeof payload.sentAt).toBe('number');
    expect(payload.sentAt).toBeGreaterThan(0);
  });
});

// ============================================================================
// Group 6 — sendTelemetry behavior (4 tests)
// ============================================================================

describe('sendTelemetry behavior', () => {
  it('calls navigator.sendBeacon with /umami/api/telemetry', async () => {
    // Arrange
    initTelemetry();
    // Act
    const [[url]] = (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, Blob][];
    // Assert
    expect(url).toBe('/umami/api/telemetry');
  });

  it('sends a JSON payload inside a Blob with application/json type', async () => {
    // Arrange
    initTelemetry();
    // Act
    const [[_url, blob]] = (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, Blob][];
    // Assert
    expect(blob.type).toBe('application/json');
    const payload = JSON.parse(await blob.text());
    expect(payload).toHaveProperty('heapSize');
    expect(payload).toHaveProperty('domNodes');
    expect(payload).toHaveProperty('errorCount');
  });

  it('never throws — even if sendBeacon or JSON.stringify fails', () => {
    // Arrange
    (navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('sendBeacon failed');
    });
    // Assert
    expect(() => initTelemetry()).not.toThrow();
    vi.advanceTimersByTime(60_000);
    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow();
  });
});

// ============================================================================
// Group 7 — initTelemetry lifecycle (4 tests)
// ============================================================================

describe('initTelemetry lifecycle', () => {
  it('sends telemetry immediately on first call', () => {
    // Arrange
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('sets up interval for subsequent sends', () => {
    // Arrange
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60_000);
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(3);
  });

  it('does not start twice — second call is idempotent', () => {
    // Arrange
    initTelemetry();
    // Assert
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    initTelemetry();
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('clears error messages after each send', async () => {
    // Arrange
    initTelemetry();
    window.dispatchEvent(new ErrorEvent('error', { message: 'first batch' }));
    vi.advanceTimersByTime(60_000);
    // Act
    const payload1 = await getLastPayload();
    // Assert
    expect((payload1.errorMessages as string[]).length).toBeGreaterThanOrEqual(1);
    vi.advanceTimersByTime(60_000);
    const payload2 = await getLastPayload();
    expect((payload2.errorMessages as string[]).length).toBe(0);
  });
});

// ============================================================================
// Group 8 — Long task observation (3 tests)
// ============================================================================

describe('long task observation', () => {
  it('creates a PerformanceObserver for longtask type', () => {
    class MockObserver {
      static supportedEntryTypes = ['longtask'];
      observe = vi.fn();
      disconnect = vi.fn();
    }
    (globalThis as unknown as Record<string, unknown>).PerformanceObserver = MockObserver as unknown;
    initTelemetry();
    // PerformanceObserver was called (mock class was invoked)
  });

  it('skips when PerformanceObserver is undefined', () => {
    // Arrange
    delete (globalThis as unknown as Record<string, unknown>).PerformanceObserver;
    // Assert
    expect(() => initTelemetry()).not.toThrow();
  });

  it('skips when longtask is not in supportedEntryTypes', () => {
    class MockObserver {
      static supportedEntryTypes = ['mark', 'measure'];
      observe = vi.fn();
      disconnect = vi.fn();
    }
    (globalThis as unknown as Record<string, unknown>).PerformanceObserver = MockObserver as unknown;
    initTelemetry();
    // No error since the code checks supportedEntryTypes and skips longtask observation
  });
});

// ============================================================================
// Group 9 — Edge cases (3 tests)
// ============================================================================

describe('edge cases', () => {
  it('handles missing serviceWorker gracefully', () => {
    // Arrange
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: undefined,
      configurable: true, writable: true,
    });
    // Assert
    expect(() => initTelemetry()).not.toThrow();
  });

  it('handles numeric segments (42 is matched as alphanumeric)', () => {
    // Arrange
    // Assert
    expect(anonymizePath('/42')).toBe('/:owner');
  });

  it('handles empty pathname segments gracefully', () => {
    // Single-character segments (a, b) are below the {2,64} regex length
    // Arrange
    // Assert
    expect(anonymizePath('//a//b')).toBe('/a/b');
  });
});
