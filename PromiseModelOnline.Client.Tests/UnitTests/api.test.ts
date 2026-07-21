import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, apiGetList, apiPost, apiPatch, apiFetch, checkSession } from '../../PromiseModelOnline.Client/wwwroot/js/api.ts';

const originalLocation = globalThis.location;

beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
    Object.defineProperty(globalThis, 'location', {
        value: { ...originalLocation, pathname: '/projects', assign: vi.fn() },
        writable: true,
    });
});

afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
    });
});

function mockFetch(status: number, body: unknown, ok?: boolean) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status,
        ok: ok ?? (status >= 200 && status < 300),
        json: () => Promise.resolve(body),
    });
}

function mockFetchError(message: string) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(message));
}

describe('apiFetch', () => {
    it('includes credentials and JSON accept header', async () => {
        // Arrange
        mockFetch(200, { data: 'ok' });
        // Act
        await apiFetch('/api/test');
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });
    });

    it('merges custom headers with accept', async () => {
        // Arrange
        mockFetch(200, {});
        // Act
        await apiFetch('/api/test', { headers: { 'X-Custom': 'value' } });
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            headers: { Accept: 'application/json', 'X-Custom': 'value' },
        }));
    });

    it('throws and redirects on 401', async () => {
        // Arrange
        mockFetch(401, {});
        const assign = vi.fn();
        // Act
        globalThis.location = { ...globalThis.location, pathname: '/projects', assign };
        // Assert
        await expect(apiFetch('/api/test')).rejects.toThrow('Unauthorized');
        expect(assign).toHaveBeenCalledWith('/login');
    });

    it('does not redirect on 401 if already on /login', async () => {
        // Arrange
        mockFetch(401, {});
        const assign = vi.fn();
        // Act
        globalThis.location = { ...globalThis.location, pathname: '/login', assign };
        // Assert
        await expect(apiFetch('/api/test')).rejects.toThrow('Unauthorized');
        expect(assign).not.toHaveBeenCalled();
    });

    it('returns response on success', async () => {
        // Arrange
        mockFetch(200, { id: 1 });
        // Act
        const response = await apiFetch('/api/test');
        // Assert
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ id: 1 });
    });
});

describe('apiGet', () => {
    it('returns parsed JSON for 200', async () => {
        // Arrange
        mockFetch(200, { id: 1 });
        // Act
        const result = await apiGet('/api/test');
        // Assert
        expect(result).toEqual({ id: 1 });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockFetch(204, undefined);
        // Act
        const result = await apiGet('/api/test');
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws for non-ok status', async () => {
        // Act
        mockFetch(500, {}, false);
        // Assert
        await expect(apiGet('/api/test')).rejects.toThrow('HTTP 500');
    });

    it('throws on network error', async () => {
        // Act
        mockFetchError('Network failure');
        // Assert
        await expect(apiGet('/api/test')).rejects.toThrow('Network failure');
    });
});

describe('apiGetList', () => {
    it('returns array for 200', async () => {
        // Arrange
        mockFetch(200, [{ id: 1 }, { id: 2 }]);
        // Act
        const result = await apiGetList('/api/list');
        // Assert
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('returns empty array for 204', async () => {
        // Arrange
        mockFetch(204, undefined);
        // Act
        const result = await apiGetList('/api/list');
        // Assert
        expect(result).toEqual([]);
    });

    it('returns empty array when response is null', async () => {
        // Arrange
        mockFetch(200, null);
        // Act
        const result = await apiGetList('/api/list');
        // Assert
        expect(result).toEqual([]);
    });
});

describe('apiPost', () => {
    it('sends POST with JSON body', async () => {
        // Arrange
        mockFetch(201, { id: 10 });
        // Act
        const result = await apiPost('/api/create', { name: 'test' });
        // Assert
        expect(result).toEqual({ id: 10 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/create', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'test' }),
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        }));
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockFetch(204, undefined);
        // Act
        const result = await apiPost('/api/create', {});
        // Assert
        expect(result).toBeUndefined();
    });
});

describe('apiPatch', () => {
    it('sends PATCH with JSON body', async () => {
        // Arrange
        mockFetch(200, { updated: true });
        // Act
        const result = await apiPatch('/api/update', { field: 'value' });
        // Assert
        expect(result).toEqual({ updated: true });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/update', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ field: 'value' }),
        }));
    });

    it('sends PATCH without body for undefined', async () => {
        // Arrange
        mockFetch(204, undefined);
        // Act
        const result = await apiPatch('/api/update', undefined);
        // Assert
        expect(result).toBeUndefined();
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/update', expect.objectContaining({
            method: 'PATCH',
        }));
        const callBody = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body;
        expect(callBody).toBeUndefined();
    });

    it('throws on non-ok response for PATCH', async () => {
        // Act
        mockFetch(500, {}, false);
        // Assert
        await expect(apiPatch('/api/update', {})).rejects.toThrow('HTTP 500');
    });

    it('throws on network error for PATCH', async () => {
        // Act
        mockFetchError('Network failure');
        // Assert
        await expect(apiPatch('/api/update', {})).rejects.toThrow('Network failure');
    });
});

describe('checkSession', () => {
    it('returns true when fetch succeeds', async () => {
        // Arrange
        mockFetch(200, { name: 'Test', userId: 1 });
        // Act
        const result = await checkSession();
        // Assert
        expect(result).toBe(true);
    });

    it('returns false when fetch fails', async () => {
        // Arrange
        mockFetch(401, {});
        // Act
        const result = await checkSession();
        // Assert
        expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
        // Arrange
        mockFetchError('Network error');
        // Act
        const result = await checkSession();
        // Assert
        expect(result).toBe(false);
    });
});
