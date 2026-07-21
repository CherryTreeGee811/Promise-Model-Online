import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="graph-content"></div>';
});

describe('requestJson', () => {
    it('returns JSON for 200 response', async () => {
        // Arrange
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 1 }) } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        // Act
        const result = await mod.requestJson('/api/test', { method: 'GET' });
        // Assert
        expect(result).toEqual({ id: 1 });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: true, status: 204 } as Response);
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        // Act
        const result = await mod.requestJson('/api/test', { method: 'DELETE' });
        // Assert
        expect(result).toBeUndefined();
    });

    it('clicks login link on 401', async () => {
        // Arrange
        const loginLink = document.createElement('a');
        loginLink.id = 'login-link';
        document.body.append(loginLink);
        const clickSpy = vi.spyOn(loginLink, 'click');
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 401 } as Response);
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        // Assert
        await expect(mod.requestJson('/api/test', {})).rejects.toThrow();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('throws with message from JSON body on error', async () => {
        // Arrange
        const { apiFetch } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ message: 'Bad request' }) } as Response);
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        // Assert
        await expect(mod.requestJson('/api/test', {})).rejects.toThrow('Bad request');
    });
});

describe('buildMomentFormElement', () => {
    it('exports buildMomentFormElement function', async () => {
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts');
        // Assert
        expect(mod.buildMomentFormElement).toBeDefined();
    });
});
