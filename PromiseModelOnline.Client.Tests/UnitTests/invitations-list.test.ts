import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts', () => ({
    getPendingInvitations: vi.fn(),
    acceptInvitation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({
    showToast: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="invitations-list"></div><div id="error-text"></div>';
});

describe('loadInvitationsPage', () => {
    it('renders invitation rows when data exists', async () => {
        // Arrange
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([
            { permissionId: 1, projectName: 'Test Proj', invitedBy: 'alice', level: 'Edit', createdAt: '2026-06-01' },
        ]);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        // Act
        const list = document.getElementById('invitations-list')!;
        // Assert
        expect(list.innerHTML).toContain('Test Proj');
    });

    it('shows empty state when no invitations', async () => {
        // Arrange
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([]);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        // Act
        const list = document.getElementById('invitations-list')!;
        // Assert
        expect(list.innerHTML).toContain('invitation') || expect(list.innerHTML).toContain('pending');
    });

    it('shows empty state when getPendingInvitations returns null', async () => {
        // Arrange
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue(null);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        // Act
        const list = document.getElementById('invitations-list')!;
        // Assert
        expect(list.innerHTML).toContain('No pending invitations');
    });

    it('removes row on accept success', async () => {
        // Arrange
        const { getPendingInvitations, acceptInvitation } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([
            { permissionId: 1, projectName: 'Test Proj', invitedBy: 'alice', level: 'Edit', createdAt: '2026-06-01' },
        ]);
        vi.mocked(acceptInvitation).mockResolvedValue(undefined);
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        const list = document.getElementById('invitations-list')!;
        // Act
        const acceptBtn = list.querySelector('.accept-btn') as HTMLElement;
        // Assert
        expect(acceptBtn).not.toBeNull();
        acceptBtn.click();
        await vi.waitFor(() => {
            expect(list.querySelector('.accept-btn')).toBeNull();
        });
    });

    it('shows error toast when acceptInvitation fails', async () => {
        // Arrange
        const { getPendingInvitations, acceptInvitation } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockResolvedValue([
            { permissionId: 1, projectName: 'Test Proj', invitedBy: 'alice', level: 'Edit', createdAt: '2026-06-01' },
        ]);
        vi.mocked(acceptInvitation).mockRejectedValue(new Error('API error'));
        const { showToast } = await import('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts');
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        const list = document.getElementById('invitations-list')!;
        const acceptBtn = list.querySelector('.accept-btn') as HTMLElement;
        acceptBtn.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(showToast).toHaveBeenCalledWith('Failed to accept invitation', 'error');
        });
    });

    it('shows error text when getPendingInvitations throws', async () => {
        // Arrange
        const { getPendingInvitations } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/api.ts');
        vi.mocked(getPendingInvitations).mockRejectedValue(new Error('Network error'));
        const { loadInvitationsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/invitations/list.ts');
        await loadInvitationsPage(document.createElement('div'));
        // Act
        const errorEl = document.getElementById('error-text')!;
        // Assert
        expect(errorEl.textContent).toBe('Failed to load invitations.');
    });
});
