import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="graph-content"></div>';
});

describe('requestJson', () => {
    it('returns JSON for 200 response', async () => {
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 1 }) } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = await mod.requestJson('/api/test', { method: 'GET' });
        expect(result).toEqual({ id: 1 });
    });

    it('returns undefined for 204', async () => {
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: true, status: 204 } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        const result = await mod.requestJson('/api/test', { method: 'DELETE' });
        expect(result).toBeUndefined();
    });

    it('clicks login link on 401', async () => {
        const loginLink = document.createElement('a');
        loginLink.id = 'login-link';
        document.body.append(loginLink);
        const clickSpy = vi.spyOn(loginLink, 'click');
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 401 } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        await expect(mod.requestJson('/api/test', {})).rejects.toThrow();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('throws with message from JSON body on error', async () => {
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ message: 'Bad request' }) } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        await expect(mod.requestJson('/api/test', {})).rejects.toThrow('Bad request');
    });
});

describe('buildMomentFormElement', () => {
    it('exports buildMomentFormElement function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        expect(mod.buildMomentFormElement).toBeDefined();
    });
});
