import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts', () => ({
    getPendingInvitations: vi.fn(),
    acceptInvitation: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="invitations-list"></div><div id="error-text"></div>';
});

describe('loadInvitationsPage', () => {
    it('renders invitation rows when data exists', async () => {
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([
            { permissionId: 1, projectName: 'Test Proj', invitedBy: 'alice', level: 'Edit', createdAt: '2026-06-01' },
        ]);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        const list = document.getElementById('invitations-list')!;
        expect(list.innerHTML).toContain('Test Proj');
    });

    it('shows empty state when no invitations', async () => {
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([]);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        const list = document.getElementById('invitations-list')!;
        expect(list.innerHTML).toContain('invitation') || expect(list.innerHTML).toContain('pending');
    });
});
