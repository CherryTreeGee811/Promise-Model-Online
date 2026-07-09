import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuthFetch = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({
    authFetch: mockAuthFetch,
    apiGet: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('fetchProjects', () => {
    it('returns parsed JSON when response is ok and non-204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ id: 1, name: 'Test' }]),
        });
        const { fetchProjects } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await fetchProjects();
        // Assert
        expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { fetchProjects } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await fetchProjects();
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws on non-ok response', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { fetchProjects } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(fetchProjects()).rejects.toThrow('HTTP 500');
    });
});

describe('createProject', () => {
    it('sends POST and returns created project', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 1, name: 'New' }),
        });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await createProject({ name: 'New' });
        // Assert
        expect(result).toEqual({ id: 1, name: 'New' });
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/projects/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New' }),
        });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await createProject({ name: 'New' });
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws with message from body on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ message: 'Name required' }),
        });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(createProject({})).rejects.toThrow('Name required');
    });

    it('throws with title fallback on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ title: 'Bad Request' }),
        });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(createProject({})).rejects.toThrow('Bad Request');
    });

    it('throws with HTTP status when no message/title', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
        });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(createProject({})).rejects.toThrow('HTTP 500');
    });

    it('uses HTTP status when JSON parsing fails', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error('parse fail')),
        });
        const { createProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(createProject({})).rejects.toThrow('HTTP 500');
    });
});

describe('updateProjectDetails', () => {
    it('sends PATCH and returns updated project', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ name: 'Updated' }),
        });
        const { updateProjectDetails } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await updateProjectDetails('owner1', 'proj1', { name: 'Updated' });
        // Assert
        expect(result).toEqual({ name: 'Updated' });
    });

    it('throws on error with parsed message', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ message: 'forbidden' }),
        });
        const { updateProjectDetails } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(updateProjectDetails('o', 'p', {})).rejects.toThrow('forbidden');
    });
});

describe('deleteProject', () => {
    it('sends DELETE and resolves', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { deleteProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(deleteProject('o', 'p')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { deleteProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(deleteProject('o', 'p')).rejects.toThrow('HTTP 500');
    });
});

describe('getProject', () => {
    it('returns project data on 200', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 1 }),
        });
        const { getProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getProject('o', 'p');
        // Assert
        expect(result).toEqual({ id: 1 });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { getProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getProject('o', 'p');
        // Assert
        expect(result).toBeUndefined();
    });

    it('returns undefined when response is falsy', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue(null);
        const { getProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getProject('o', 'p');
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws on non-ok status', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 404 });
        const { getProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(getProject('o', 'p')).rejects.toThrow('HTTP 404');
    });
});

describe('exportProject', () => {
    it('returns blob on success', async () => {
        // Arrange
        const blob = new Blob(['{}']);
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            blob: () => Promise.resolve(blob),
        });
        const { exportProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await exportProject('o', 'p');
        // Assert
        expect(result).toBe(blob);
    });

    it('throws on error with parsed message', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'export failed' }),
        });
        const { exportProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(exportProject('o', 'p')).rejects.toThrow('export failed');
    });

    it('throws with title fallback', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ title: 'Export Error' }),
        });
        const { exportProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(exportProject('o', 'p')).rejects.toThrow('Export Error');
    });
});

describe('getAuditEvents', () => {
    it('returns items and totalCount from header', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ id: 1 }]),
            headers: { get: (name: string) => name === 'X-Total-Count' ? '42' : null },
        });
        const { getAuditEvents } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getAuditEvents('o', 'p');
        // Assert
        expect(result).toEqual({ items: [{ id: 1 }], totalCount: 42 });
    });

    it('falls back to items.length when X-Total-Count is missing', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ id: 1 }]),
            headers: { get: () => null },
        });
        const { getAuditEvents } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getAuditEvents('o', 'p');
        // Assert
        expect(result).toEqual({ items: [{ id: 1 }], totalCount: 1 });
    });

    it('passes take and skip params', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
            headers: { get: () => null },
        });
        const { getAuditEvents } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        await getAuditEvents('o', 'p', 20, 40);
        // Assert
        expect(mockAuthFetch).toHaveBeenCalledWith(expect.stringContaining('take=20&skip=40'));
    });

    it('uses defaults for take=10 and skip=0', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
            headers: { get: () => null },
        });
        const { getAuditEvents } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        await getAuditEvents('o', 'p');
        // Assert
        expect(mockAuthFetch).toHaveBeenCalledWith(expect.stringContaining('take=10&skip=0'));
    });

    it('throws on non-ok response', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { getAuditEvents } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(getAuditEvents('o', 'p')).rejects.toThrow('HTTP 500');
    });
});

describe('importProject', () => {
    it('sends file as FormData and returns project', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 1 }),
        });
        const { importProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        const file = new File(['{}'], 'export.json', { type: 'application/json' });
        // Act
        const result = await importProject(file);
        // Assert
        expect(result).toEqual({ id: 1 });
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/projects/import', {
            method: 'POST',
            body: expect.any(FormData),
        });
    });

    it('throws with body.message on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ message: 'Invalid file' }),
        });
        const { importProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(importProject(new File([''], 'x.json'))).rejects.toThrow('Invalid file');
    });

    it('throws with errors array joined', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ errors: ['File too large', 'Invalid format'] }),
        });
        const { importProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(importProject(new File([''], 'x.json'))).rejects.toThrow('File too large Invalid format');
    });

    it('throws with HTTP status as last resort', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error('parse fail')),
        });
        const { importProject } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(importProject(new File([''], 'x.json'))).rejects.toThrow('HTTP 500');
    });
});

describe('getPermissions', () => {
    it('returns permissions on success', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ id: '1', level: 'Edit' }]),
        });
        const { getPermissions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getPermissions('o', 'p');
        // Assert
        expect(result).toEqual([{ id: '1', level: 'Edit' }]);
    });

    it('throws on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 403 });
        const { getPermissions } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(getPermissions('o', 'p')).rejects.toThrow('HTTP 403');
    });
});

describe('inviteUser', () => {
    it('sends POST and returns permission', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: '10' }),
        });
        const { inviteUser } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await inviteUser('o', 'p', { email: 'a@b.com', level: 'Edit' });
        // Assert
        expect(result).toEqual({ id: '10' });
    });

    it('throws on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 400 });
        const { inviteUser } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(inviteUser('o', 'p', {})).rejects.toThrow('HTTP 400');
    });
});

describe('searchUsers', () => {
    it('returns users from apiGet', async () => {
        // Arrange
        const { searchUsers } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        (mod.apiGet as ReturnType<typeof vi.fn>).mockResolvedValue([{ email: 'a@b.com' }]);
        // Act
        const result = await searchUsers('test');
        // Assert
        expect(result).toEqual([{ email: 'a@b.com' }]);
    });
});

describe('removePermission', () => {
    it('sends DELETE and resolves', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { removePermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(removePermission('o', 'p', 1)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { removePermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(removePermission('o', 'p', 1)).rejects.toThrow('HTTP 500');
    });
});

describe('getGraphData', () => {
    it('returns graph data on 200', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ nodes: [], links: [] }),
        });
        const { getGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getGraphData('o', 'p');
        // Assert
        expect(result).toEqual({ nodes: [], links: [] });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { getGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getGraphData('o', 'p');
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws on non-ok', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { getGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(getGraphData('o', 'p')).rejects.toThrow('HTTP 500');
    });
});

describe('getMyPermission', () => {
    it('returns permission on 200', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ permission: 'Edit' }),
        });
        const { getMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getMyPermission('o', 'p');
        // Assert
        expect(result).toEqual({ permission: 'Edit' });
    });

    it('returns undefined for 204', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: true, status: 204 });
        const { getMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act
        const result = await getMyPermission('o', 'p');
        // Assert
        expect(result).toBeUndefined();
    });

    it('throws on non-ok', async () => {
        // Arrange
        mockAuthFetch.mockResolvedValue({ ok: false, status: 500 });
        const { getMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts');
        // Act & Assert
        await expect(getMyPermission('o', 'p')).rejects.toThrow('HTTP 500');
    });
});
