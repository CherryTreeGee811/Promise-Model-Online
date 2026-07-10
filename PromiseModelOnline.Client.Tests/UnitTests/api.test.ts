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
        mockFetch(200, { data: 'ok' });
        await apiFetch('/api/test');
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });
    });

    it('merges custom headers with accept', async () => {
        mockFetch(200, {});
        await apiFetch('/api/test', { headers: { 'X-Custom': 'value' } });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            headers: { Accept: 'application/json', 'X-Custom': 'value' },
        }));
    });

    it('throws and redirects on 401', async () => {
        mockFetch(401, {});
        const assign = vi.fn();
        globalThis.location = { ...globalThis.location, pathname: '/projects', assign };
        await expect(apiFetch('/api/test')).rejects.toThrow('Unauthorized');
        expect(assign).toHaveBeenCalledWith('/login');
    });

    it('does not redirect on 401 if already on /login', async () => {
        mockFetch(401, {});
        const assign = vi.fn();
        globalThis.location = { ...globalThis.location, pathname: '/login', assign };
        await expect(apiFetch('/api/test')).rejects.toThrow('Unauthorized');
        expect(assign).not.toHaveBeenCalled();
    });

    it('returns response on success', async () => {
        mockFetch(200, { id: 1 });
        const response = await apiFetch('/api/test');
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ id: 1 });
    });
});

describe('apiGet', () => {
    it('returns parsed JSON for 200', async () => {
        mockFetch(200, { id: 1 });
        const result = await apiGet('/api/test');
        expect(result).toEqual({ id: 1 });
    });

    it('returns undefined for 204', async () => {
        mockFetch(204, undefined);
        const result = await apiGet('/api/test');
        expect(result).toBeUndefined();
    });

    it('throws for non-ok status', async () => {
        mockFetch(500, {}, false);
        await expect(apiGet('/api/test')).rejects.toThrow('HTTP 500');
    });

    it('throws on network error', async () => {
        mockFetchError('Network failure');
        await expect(apiGet('/api/test')).rejects.toThrow('Network failure');
    });
});

describe('apiGetList', () => {
    it('returns array for 200', async () => {
        mockFetch(200, [{ id: 1 }, { id: 2 }]);
        const result = await apiGetList('/api/list');
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('returns empty array for 204', async () => {
        mockFetch(204, undefined);
        const result = await apiGetList('/api/list');
        expect(result).toEqual([]);
    });

    it('returns empty array when response is null', async () => {
        mockFetch(200, null);
        const result = await apiGetList('/api/list');
        expect(result).toEqual([]);
    });
});

describe('apiPost', () => {
    it('sends POST with JSON body', async () => {
        mockFetch(201, { id: 10 });
        const result = await apiPost('/api/create', { name: 'test' });
        expect(result).toEqual({ id: 10 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/create', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'test' }),
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        }));
    });

    it('returns undefined for 204', async () => {
        mockFetch(204, undefined);
        const result = await apiPost('/api/create', {});
        expect(result).toBeUndefined();
    });
});

describe('apiPatch', () => {
    it('sends PATCH with JSON body', async () => {
        mockFetch(200, { updated: true });
        const result = await apiPatch('/api/update', { field: 'value' });
        expect(result).toEqual({ updated: true });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/update', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ field: 'value' }),
        }));
    });

    it('sends PATCH without body for undefined', async () => {
        mockFetch(204, undefined);
        const result = await apiPatch('/api/update', undefined);
        expect(result).toBeUndefined();
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/update', expect.objectContaining({
            method: 'PATCH',
        }));
        const callBody = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body;
        expect(callBody).toBeUndefined();
    });

    it('throws on non-ok response for PATCH', async () => {
        mockFetch(500, {}, false);
        await expect(apiPatch('/api/update', {})).rejects.toThrow('HTTP 500');
    });

    it('throws on network error for PATCH', async () => {
        mockFetchError('Network failure');
        await expect(apiPatch('/api/update', {})).rejects.toThrow('Network failure');
    });
});

describe('checkSession', () => {
    it('returns true when fetch succeeds', async () => {
        mockFetch(200, { name: 'Test', userId: 1 });
        const result = await checkSession();
        expect(result).toBe(true);
    });

    it('returns false when fetch fails', async () => {
        mockFetch(401, {});
        const result = await checkSession();
        expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
        mockFetchError('Network error');
        const result = await checkSession();
        expect(result).toBe(false);
    });
});
