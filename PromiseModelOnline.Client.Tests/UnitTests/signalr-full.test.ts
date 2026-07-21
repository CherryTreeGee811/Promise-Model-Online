import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({ showToast: vi.fn() }));

beforeAll(() => {
    const mockConnection: Record<string, unknown> = {
        withUrl: function () { return this; },
        withAutomaticReconnect: function () { return this; },
        configureLogging: function () { return this; },
        build: function () { return this; },
        on: vi.fn(),
        onclose: vi.fn(),
        onreconnecting: vi.fn(),
        onreconnected: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        state: 'Disconnected',
    };
    class HubConnectionBuilderMock {
        constructor() { return mockConnection as unknown as HubConnectionBuilderMock; }
    }
    (globalThis as Record<string, unknown>).signalR = {
        HubConnectionBuilder: HubConnectionBuilderMock,
        LogLevel: { Warning: 2 },
    };
});

describe('startSignalR guard and lifecycle', () => {
    it('exports startSignalR', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        // Assert
        expect(mod.startSignalR).toBeDefined();
    });
});
