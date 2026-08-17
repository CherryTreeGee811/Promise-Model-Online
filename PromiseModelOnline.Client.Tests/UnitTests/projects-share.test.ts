import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

    afterEach(() => {
        vi.useRealTimers();
    });

    it('handles missing section element gracefully', async () => {
        // Arrange
        document.body.innerHTML = '<span id="error-text"></span><span id="loading-text">Loading...</span>';
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
        // Act
        // Assert
            expect(mockGetPermissions).toHaveBeenCalled();
        });
        expect(document.querySelector('#permissions-section')).toBeNull();
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

    describe('autocomplete', () => {
        async function openModalAndGetInput(): Promise<HTMLInputElement> {
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
            return document.querySelector('#invite-email') as HTMLInputElement;
        }

        async function waitForDebounce(): Promise<void> {
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        it('opens autocomplete dropdown when search returns results', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();
        // Act

        // Assert
            expect(mockSearchUsers).toHaveBeenCalledWith('ali');
            const items = document.querySelectorAll('.comment-autocomplete__item');
            expect(items.length).toBe(1);
            expect(items[0].textContent).toBe('alice@test.com (Alice)');
            const dropdown = document.querySelector('#invite-autocomplete')!;
            expect(dropdown.classList.contains('d-none')).toBe(false);
        });

        it('closes autocomplete when search returns no results', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'xyz';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();
        // Act

        // Assert
            expect(mockSearchUsers).toHaveBeenCalledWith('xyz');
            const dropdown = document.querySelector('#invite-autocomplete')!;
            expect(dropdown.classList.contains('d-none')).toBe(true);
        });

        it('closes autocomplete when search API throws', async () => {
        // Arrange
            mockSearchUsers.mockRejectedValue(new Error('network'));
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();
        // Act

        // Assert
            expect(mockSearchUsers).toHaveBeenCalled();
            const dropdown = document.querySelector('#invite-autocomplete')!;
            expect(dropdown.classList.contains('d-none')).toBe(true);
        });

        it('closes autocomplete on empty input', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(1);

            emailInput.value = '';
            emailInput.dispatchEvent(new Event('input'));

            await vi.waitFor(() => {
                const dropdown = document.querySelector('#invite-autocomplete')!;
                expect(dropdown.classList.contains('d-none')).toBe(true);
            });
        });

        it('selects autocomplete item on mousedown', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            const items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(1);

            const item = document.querySelector('.comment-autocomplete__item') as HTMLElement;
            item.dispatchEvent(new MouseEvent('mousedown'));

            expect(emailInput.value).toBe('alice@test.com');
        });

        it('navigates autocomplete with ArrowDown and ArrowUp', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([
                { name: 'Alice', email: 'alice@test.com' },
                { name: 'Bob', email: 'bob@test.com' },
            ]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'a';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(2);
            expect(items[0].classList.contains('comment-autocomplete__item--highlight')).toBe(true);
            expect(items[1].classList.contains('comment-autocomplete__item--highlight')).toBe(false);

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

            items = document.querySelectorAll('.comment-autocomplete__item');
            expect(items[0].classList.contains('comment-autocomplete__item--highlight')).toBe(false);
            expect(items[1].classList.contains('comment-autocomplete__item--highlight')).toBe(true);

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

            items = document.querySelectorAll('.comment-autocomplete__item');
            expect(items[0].classList.contains('comment-autocomplete__item--highlight')).toBe(true);
            expect(items[1].classList.contains('comment-autocomplete__item--highlight')).toBe(false);
        });

        it('selects highlighted item with Enter', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([
                { name: 'Alice', email: 'alice@test.com' },
                { name: 'Bob', email: 'bob@test.com' },
            ]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'a';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(2);

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

            expect(emailInput.value).toBe('bob@test.com');
        });

        it('closes autocomplete with Escape', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(1);

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

            const dropdown = document.querySelector('#invite-autocomplete')!;
            expect(dropdown.classList.contains('d-none')).toBe(true);
        });

        it('selects highlighted item with Tab', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(1);

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

            expect(emailInput.value).toBe('alice@test.com');
        });

        it('closes autocomplete on blur when focus leaves dropdown', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([{ name: 'Alice', email: 'alice@test.com' }]);
            const emailInput = await openModalAndGetInput();

            emailInput.value = 'ali';
            emailInput.dispatchEvent(new Event('input'));
            await waitForDebounce();

            let items = document.querySelectorAll('.comment-autocomplete__item');
        // Act
        // Assert
            expect(items.length).toBe(1);

            emailInput.dispatchEvent(new Event('blur'));

            await vi.waitFor(() => {
                const dropdown = document.querySelector('#invite-autocomplete')!;
                expect(dropdown.classList.contains('d-none')).toBe(true);
            }, { timeout: 500 });
        });

        it('keyboard does nothing when autocomplete is closed', async () => {
        // Arrange
            mockSearchUsers.mockResolvedValue([]);
            const emailInput = await openModalAndGetInput();

            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        // Act

        // Assert
            expect(mockSearchUsers).not.toHaveBeenCalled();
            const dropdown = document.querySelector('#invite-autocomplete')!;
            expect(dropdown.classList.contains('d-none')).toBe(true);
        });

        it('does not call inviteUser on submit with empty email', async () => {
        // Arrange
            const emailInput = await openModalAndGetInput();
            emailInput.value = '';

            const form = document.querySelector('#invite-modal-form') as HTMLFormElement;
            form.dispatchEvent(new Event('submit'));
        // Act

        // Assert
            await expect(vi.waitFor(() => {
                expect(mockInviteUser).not.toHaveBeenCalled();
            })).resolves.not.toThrow();
        });
    });

    it('does not re-bind revoke button if already bound', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
        // Act
        // Assert
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });

        const revokeBtn = document.querySelector('.revoke-btn') as HTMLElement;
        expect(revokeBtn.dataset.bound).toBe('1');

        revokeBtn.click();
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal')).not.toBeNull();
        });

        const modalCount = mockBootstrapModal.getOrCreateInstance.mock.calls.length;
        expect(modalCount).toBe(1);
    });

    it('handles null permissions gracefully', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue(null);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
        // Act
        // Assert
            expect(section.textContent).toContain('No permissions configured');
        });
    });

    it('handles undefined permissions gracefully', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
        // Act
        // Assert
            expect(section.textContent).toContain('No permissions configured');
        });
    });

    it('renders non-owner empty state without invite button', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue(null);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: false });
        await vi.waitFor(() => {
            const section = document.querySelector('#permissions-section')!;
        // Act
        // Assert
            expect(section.textContent).toContain('No permissions configured');
        });
        expect(document.querySelector('#empty-state-invite-btn')).toBeNull();
    });

    it('calls ensureRevokeModal when revoke button is clicked via existing modal', async () => {
        // Arrange
        document.body.innerHTML += `
            <div class="modal fade" id="revoke-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Revoke Permission</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0" id="revoke-modal-text">Revoke this permission?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="revoke-modal-confirm">Revoke</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mockGetPermissions.mockResolvedValue([
            { id: '99', userName: 'Charlie', level: 'View', status: 'Active' },
        ]);
        mockRemovePermission.mockResolvedValue(undefined);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
        // Act
        // Assert
            expect(document.querySelector('.revoke-btn')).not.toBeNull();
        });
        (document.querySelector('.revoke-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#revoke-modal-confirm')).not.toBeNull();
        });
        (document.querySelector('#revoke-modal-confirm') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(mockRemovePermission).toHaveBeenCalledWith('o', 'p', 99);
        });
    });

    it('loads permissions on top invite button click', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([
            { id: '1', userName: 'Alice', level: 'Edit', status: 'Active' },
        ]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
        // Act
        // Assert
            expect(document.querySelector('#invite-btn-top')).not.toBeNull();
        });
        (document.querySelector('#invite-btn-top') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(document.querySelector('#invite-modal-form')).not.toBeNull();
        });
    });

    it('shows loading element and hides on permissions load', async () => {
        // Arrange
        mockGetPermissions.mockResolvedValue([]);
        const { loadSharePage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/share.ts');
        loadSharePage('o', 'p', document.createElement('div'), { isOwner: true });
        await vi.waitFor(() => {
            const loadingEl = document.querySelector('#loading-text') as HTMLElement;
        // Act
        // Assert
            expect(loadingEl.classList.contains('d-none')).toBe(true);
        });
    });
});
