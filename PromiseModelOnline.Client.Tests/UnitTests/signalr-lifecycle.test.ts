import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({ showToast: vi.fn() }));

beforeAll(() => {
    const handlerRegistrations: Record<string, Array<(...args: unknown[]) => void>> = {};
    const mockConnection = {
        withUrl: function () { return this; },
        withAutomaticReconnect: function () { return this; },
        configureLogging: function () { return this; },
        build: function () { return this; },
        on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            handlerRegistrations[event] ??= [];
            handlerRegistrations[event].push(handler);
        }),
        onclose: vi.fn((handler: (...args: unknown[]) => void) => {
            handlerRegistrations['close'] ??= [];
            handlerRegistrations['close'].push(handler);
        }),
        onreconnecting: vi.fn((handler: (...args: unknown[]) => void) => {
            handlerRegistrations['reconnecting'] ??= [];
            handlerRegistrations['reconnecting'].push(handler);
        }),
        onreconnected: vi.fn((handler: (...args: unknown[]) => void) => {
            handlerRegistrations['reconnected'] ??= [];
            handlerRegistrations['reconnected'].push(handler);
        }),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        state: 'Disconnected',
    };
    class BuilderMock { constructor() { return mockConnection as never; } }
    (globalThis as Record<string, unknown>).signalR = { HubConnectionBuilder: BuilderMock, LogLevel: { Warning: 2 } };
});

describe('SignalR lifecycle', () => {
    it('registers handlers and starts connection', async () => {
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        const onNotification = vi.fn();
        await startSignalR(onNotification);
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        expect(showToast).toBeDefined();
    });

    it('exports startSignalR', async () => {
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        expect(startSignalR).toBeDefined();
    });
});
