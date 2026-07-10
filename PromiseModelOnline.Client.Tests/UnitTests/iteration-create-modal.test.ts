import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateIteration = vi.fn();
const mockBootstrapModal = { getOrCreateInstance: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn() }) };

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/iterations/api.ts', () => ({
    createIteration: mockCreateIteration,
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    (globalThis as Record<string, unknown>).bootstrap = { Modal: mockBootstrapModal };
});

async function openModal(onCreated = vi.fn()): Promise<void> {
    const { openIterationCreateModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/iteration-create-modal.ts');
    openIterationCreateModal('owner1', 'proj1', onCreated);
}

describe('openIterationCreateModal', () => {
    it('creates and shows the modal', async () => {
        // Act
        await openModal();
        // Assert
        const modal = document.querySelector('#iteration-create-modal');
        expect(modal).not.toBeNull();
        expect(mockBootstrapModal.getOrCreateInstance).toHaveBeenCalled();
    });

    it('populates modal with form elements', async () => {
        // Act
        await openModal();
        // Assert
        expect(document.querySelector('#iteration-create-form')).not.toBeNull();
        expect(document.querySelector('#iteration-create-name')).not.toBeNull();
        expect(document.querySelector('#iteration-create-error')).not.toBeNull();
        expect(document.querySelector('#iteration-create-submit')).not.toBeNull();
    });

    it('clears name input and error on open', async () => {
        // Act
        await openModal();
        // Assert
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        const errorEl = document.querySelector('#iteration-create-error') as HTMLElement;
        expect(nameInput.value).toBe('');
        expect(errorEl.textContent).toBe('');
        expect(errorEl.classList.contains('d-none')).toBe(true);
    });

    it('resets submit button on open', async () => {
        // Act
        await openModal();
        // Assert
        const submitBtn = document.querySelector('#iteration-create-submit') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(false);
        expect(submitBtn.textContent).toBe('Create Iteration');
    });

    it('shows error when name is empty on submit', async () => {
        // Arrange
        await openModal();
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const errorEl = document.querySelector('#iteration-create-error') as HTMLElement;
        expect(errorEl.textContent).toBe('Iteration name is required.');
        expect(errorEl.classList.contains('d-none')).toBe(false);
    });

    it('calls createIteration and hides modal on success', async () => {
        // Arrange
        mockCreateIteration.mockResolvedValue({ id: 1 });
        const onCreated = vi.fn().mockResolvedValue(undefined);
        await openModal(onCreated);
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        nameInput.value = 'Sprint 1';
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockCreateIteration).toHaveBeenCalledWith('owner1', 'proj1', { name: 'Sprint 1' });
            expect(mockBootstrapModal.getOrCreateInstance().hide).toHaveBeenCalled();
            expect(onCreated).toHaveBeenCalled();
        });
    });

    it('sets submit button to disabled while creating', async () => {
        // Arrange
        let resolveCreate!: (value: unknown) => void;
        mockCreateIteration.mockReturnValue(new Promise(resolve => { resolveCreate = resolve; }));
        const onCreated = vi.fn();
        await openModal(onCreated);
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        nameInput.value = 'Sprint 1';
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const submitBtn = document.querySelector('#iteration-create-submit') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(true);
        expect(submitBtn.textContent).toBe('Creating...');
        resolveCreate({ id: 1 });
        await vi.waitFor(() => {
            expect(submitBtn.disabled).toBe(false);
            expect(submitBtn.textContent).toBe('Create Iteration');
        });
    });

    it('shows error on API failure', async () => {
        // Arrange
        mockCreateIteration.mockRejectedValue(new Error('Name taken'));
        await openModal();
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        nameInput.value = 'Duplicate';
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#iteration-create-error') as HTMLElement;
            expect(errorEl.textContent).toBe('Name taken');
            expect(errorEl.classList.contains('d-none')).toBe(false);
        });
    });

    it('shows generic error when error has no message', async () => {
        // Arrange
        mockCreateIteration.mockRejectedValue(new Error());
        await openModal();
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        nameInput.value = 'Fail';
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#iteration-create-error') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to create iteration.');
        });
    });

    it('trims whitespace from name before validation', async () => {
        // Arrange
        mockCreateIteration.mockResolvedValue({ id: 1 });
        await openModal();
        const nameInput = document.querySelector('#iteration-create-name') as HTMLInputElement;
        nameInput.value = '   ';
        const form = document.querySelector('#iteration-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const errorEl = document.querySelector('#iteration-create-error') as HTMLElement;
        expect(errorEl.textContent).toBe('Iteration name is required.');
    });

    it('reuses existing modal element on second open', async () => {
        // Arrange
        mockCreateIteration.mockResolvedValue({ id: 1 });
        await openModal();
        const modal1 = document.querySelector('#iteration-create-modal');
        // Act
        await openModal();
        // Assert
        const modal2 = document.querySelector('#iteration-create-modal');
        expect(modal1).toBe(modal2);
    });

    it('handles missing form elements gracefully', async () => {
        // Arrange
        document.body.innerHTML = '<div id="iteration-create-modal"><div id="wrong-id"></div></div>';
        const { openIterationCreateModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/iteration-create-modal.ts');
        // Act & Assert
        expect(() => openIterationCreateModal('o', 'p', vi.fn())).not.toThrow();
    });
});
