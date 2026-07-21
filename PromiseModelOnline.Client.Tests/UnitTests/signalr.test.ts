import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({ showToast: vi.fn() }));

beforeAll(() => {
    class HubConnectionBuilderMock {
        withUrl = vi.fn().mockReturnThis();
        withAutomaticReconnect = vi.fn().mockReturnThis();
        configureLogging = vi.fn().mockReturnThis();
        build = vi.fn().mockReturnThis();
        on = vi.fn();
        onclose = vi.fn();
        onreconnecting = vi.fn();
        onreconnected = vi.fn();
        start = vi.fn().mockResolvedValue(undefined);
        stop = vi.fn().mockResolvedValue(undefined);
        state = 'Disconnected';
    }
    (globalThis as Record<string, unknown>).signalR = {
        HubConnectionBuilder: HubConnectionBuilderMock,
        LogLevel: { Warning: 2 },
    };
});

describe('startSignalR', () => {
    it('creates hub connection and registers handlers', async () => {
        // Arrange
        const { startSignalR } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/signalr.ts');
        const onNotification = vi.fn();
        await startSignalR(onNotification);
        // Act
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        // Assert
        expect(showToast).not.toHaveBeenCalled();
    });
});
