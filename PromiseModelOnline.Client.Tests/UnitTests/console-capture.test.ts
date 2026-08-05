import { describe, it, expect, beforeEach } from 'vitest';
import {
    initConsoleCapture,
    getFormattedConsoleLogs,
    clearConsoleLogs,
    captureNetworkError,
} from '../../PromiseModelOnline.Client/wwwroot/js/utils/console-capture.ts';

describe('console-capture', () => {
    beforeEach(() => {
        clearConsoleLogs();
    });

    it('captures console method output with level and text', () => {
        // Arrange
        initConsoleCapture();
        // Act
        console.log('hello');
        console.warn('careful');
        console.error('boom');
        console.info('note');
        console.debug('trace');
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('[log] hello');
        expect(logs).toContain('[warn] careful');
        expect(logs).toContain('[error] boom');
        expect(logs).toContain('[info] note');
        expect(logs).toContain('[debug] trace');
    });

    it('formats Error arguments with name, message and stack', () => {
        // Arrange
        initConsoleCapture();
        // Act
        console.error(new Error('kaboom'));
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('Error: kaboom');
    });

    it('captures uncaught exceptions dispatched on window', () => {
        // Arrange
        initConsoleCapture();
        // Act
        window.dispatchEvent(new ErrorEvent('error', { message: 'boom', error: new Error('boom') }));
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('[error] Error: boom');
    });

    it('captures failed resource loads as error entries', () => {
        // Arrange
        initConsoleCapture();
        const img = document.createElement('img');
        img.src = 'https://example.com/missing.png';
        document.body.appendChild(img);
        // Act
        img.dispatchEvent(new Event('error', { bubbles: true }));
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('[error] Failed to load resource: https://example.com/missing.png');
    });

    it('captures unhandled promise rejections with an Error reason', () => {
        // Arrange
        initConsoleCapture();
        const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
        Object.defineProperty(rejection, 'reason', { value: new Error('rejected') });
        // Act
        window.dispatchEvent(rejection);
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('Unhandled promise rejection: Error: rejected');
    });

    it('captures unhandled promise rejections with a non-Error reason', () => {
        // Arrange
        initConsoleCapture();
        const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
        Object.defineProperty(rejection, 'reason', { value: 'oops' });
        // Act
        window.dispatchEvent(rejection);
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('Unhandled promise rejection: oops');
    });

    it('captures CSP violations as warning entries', () => {
        // Arrange
        initConsoleCapture();
        const violation = new Event('securitypolicyviolation') as SecurityPolicyViolationEvent;
        Object.defineProperty(violation, 'violatedDirective', { value: 'script-src' });
        Object.defineProperty(violation, 'blockedURI', { value: 'https://evil.example/1.js' });
        // Act
        window.dispatchEvent(violation);
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('[warn] CSP violation (script-src): https://evil.example/1.js');
    });

    it('records failed network requests via captureNetworkError', () => {
        // Arrange
        initConsoleCapture();
        // Act
        captureNetworkError('GET', '/api/projects', 500);
        captureNetworkError('POST', '/api/bug-reports', 'TypeError: Failed to fetch');
        // Assert
        const logs = getFormattedConsoleLogs();
        expect(logs).toContain('[error] GET /api/projects → 500');
        expect(logs).toContain('[error] POST /api/bug-reports → TypeError: Failed to fetch');
    });

    it('is idempotent and does not double-register window listeners', () => {
        // Arrange
        initConsoleCapture();
        initConsoleCapture();
        clearConsoleLogs();
        // Act
        window.dispatchEvent(new ErrorEvent('error', { message: 'once', error: new Error('once') }));
        // Assert: exactly one captured entry (not the stack-trace line, which
        // also contains "Error: once" and would double-count a single capture).
        const logs = getFormattedConsoleLogs();
        const matches = logs.split('\n').filter(line => line.includes('[error] Error: once'));
        expect(matches).toHaveLength(1);
    });

    it('clearConsoleLogs empties the buffer', () => {
        // Arrange
        initConsoleCapture();
        console.log('temporary');
        expect(getFormattedConsoleLogs()).toContain('[log] temporary');
        // Act
        clearConsoleLogs();
        // Assert
        expect(getFormattedConsoleLogs()).toBe('');
    });
});
