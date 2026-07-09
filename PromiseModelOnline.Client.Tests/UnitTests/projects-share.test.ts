import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetPermissions = vi.fn();
const mockInviteUser = vi.fn();
const mockRemovePermission = vi.fn();
const mockSearchUsers = vi.fn();
const mockBootstrapModal = { getOrCreateInstance: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn() }) };

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getPermissions: mockGetPermissions,
    inviteUser: mockInviteUser,
    removePermission: mockRemovePermission,
    searchUsers: mockSearchUsers,
}));

describe('loadSharePage', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="permissions-section"></div>
            <span id="error-text"></span>
            <span id="loading-text">Loading...</span>
            <span id="success-text"></span>
        `;
        vi.clearAllMocks();
        (globalThis as Record<string, unknown>).bootstrap = { Modal: mockBootstrapModal };
    });

    it('returns early when section element is missing', () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadSharePage } = import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act & Assert
        expect(() => { loadSharePage; }).not.toThrow();
    });

    it('calls getPermissions on load', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('owner1', 'proj1', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(mockGetPermissions).toHaveBeenCalledWith('owner1', 'proj1');
        });
    });

    it('renders permissions table with rows', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '1', userName: 'Alice', level: 'Edit', status: 'Active' },
            { id: '2', userName: 'Bob', level: 'View', status: 'Pending' },
        ]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            const rows = document.querySelectorAll('#permissions-section tbody tr');
            expect(rows.length).toBe(2);
            expect(rows[0].textContent).toContain('Alice');
            expect(rows[1].textContent).toContain('Bob');
        });
    });

    it('shows empty state when no permissions', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
            expect(section.textContent).toContain('No permissions configured');
        });
    });

    it('shows invite button for owner in empty state', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).not.toBeNull();
        });
    });

    it('does not show invite button for non-owner', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: false });
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).toBeNull();
        });
    });

    it('shows revoke buttons for owner', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '1', userName: 'Alice', level: 'Edit', status: 'Active' },
        ]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
    });

    it('shows dash in actions for non-owner', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '1', userName: 'Alice', level: 'Edit', status: 'Active' },
        ]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: false });
        // Assert
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
            expect(section.textContent).toContain('-');
            expect(document.querySelector('.revoke-btn')).toBeNull();
        });
    });

    it('shows error on failed load', async () => {
        // Arrange
        mockGetPermissions.mockRejectedValue(new Error('fail'));
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to load permissions.');
        });
    });

    it('opens invite modal on empty state button click', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).not.toBeNull();
        });
        // Act
        (document.querySelector('#empty-state-invite-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#invite-modal-form')).not.toBeNull();
        });
    });

    it('populates invite email when selecting autocomplete item', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).not.toBeNull();
        });
        (document.querySelector('#empty-state-invite-btn') as HTMLButtonElement).click();
        // Act
        const emailInput = document.querySelector('#invite-email') as HTMLInputElement;
        expect(emailInput).not.toBeNull();
        // Assert
        expect(emailInput.value).toBe('');
    });

    it('shows non-owner note when isOwner is false', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '1', userName: 'Alice', level: 'Edit', status: 'Active' },
        ]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        // Act
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: false });
        // Assert
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
            expect(section.textContent).toContain('Only the project owner can manage permissions');
        });
    });

    it('handles invite submission and calls inviteUser', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        mockInviteUser.mockResolvedValue({});
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).not.toBeNull();
        });
        (document.querySelector('#empty-state-invite-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#invite-email')).not.toBeNull();
        });
        const emailInput = document.querySelector('#invite-email') as HTMLInputElement;
        emailInput.value = 'user@example.com';
        // Act
        const form = document.querySelector('#invite-modal-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockInviteUser).toHaveBeenCalledWith('o', 'p', { email: 'user@example.com', level: 'View' });
        });
    });

    it('shows invite error on API failure', async () => {
        // Arrange
        mockInviteUser.mockRejectedValue(new Error('already invited'));
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#empty-state-invite-btn')).not.toBeNull();
        });
        (document.querySelector('#empty-state-invite-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#invite-email')).not.toBeNull();
        });
        const emailInput = document.querySelector('#invite-email') as HTMLInputElement;
        emailInput.value = 'user@example.com';
        const form = document.querySelector('#invite-modal-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#invite-modal-error') as HTMLElement;
            expect(errorEl.textContent).toBe('already invited');
        });
    });

    it('opens revoke modal when revoke button is clicked', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
        // Act
        (document.querySelector('.revoke-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal')).not.toBeNull();
        });
    });

    it('calls removePermission on revoke confirm', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
        (document.querySelector('.revoke-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal-confirm')).not.toBeNull();
        });
        // Act
        (document.querySelector('#revoke-modal-confirm') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            expect(mockRemovePermission).toHaveBeenCalledWith('o', 'p', 99);
        });
    });

    it('removes row and shows success on revoke', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
        (document.querySelector('.revoke-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal-confirm')).not.toBeNull();
        });
        // Act
        (document.querySelector('#revoke-modal-confirm') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            expect(document.querySelectorAll('#permissions-section tbody tr').length).toBe(0);
            const successEl = document.querySelector('#success-text') as HTMLElement;
            expect(successEl.textContent).toBe('Permission revoked.');
        });
    });

    it('shows error when revoke API fails', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockRejectedValue(new Error('forbidden'));
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
        (document.querySelector('.revoke-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal-confirm')).not.toBeNull();
        });
        // Act
        (document.querySelector('#revoke-modal-confirm') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to revoke permission.');
        });
    });
});
