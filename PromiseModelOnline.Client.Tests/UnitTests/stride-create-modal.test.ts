import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateStride = vi.fn();
const mockBootstrapModal = { getOrCreateInstance: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn() }) };

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    createStride: mockCreateStride,
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    (globalThis as Record<string, unknown>).bootstrap = { Modal: mockBootstrapModal };
});

async function openModal(overrides: Record<string, unknown> = {}): Promise<void> {
    const { openStrideCreateModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/stride-create-modal.ts');
    openStrideCreateModal({
        owner: 'owner1',
        project: 'proj1',
        iterationId: 5,
        iterations: [{ id: 5, name: 'Sprint 1' }, { id: 6, name: 'Sprint 2' }],
        existingStrides: [],
        onCreated: vi.fn(),
        ...overrides,
    });
}

describe('openStrideCreateModal', () => {
    it('creates and shows the modal', async () => {
        // Act
        await openModal();
        // Assert
        const modal = document.querySelector('#stride-create-modal');
        expect(modal).not.toBeNull();
        expect(mockBootstrapModal.getOrCreateInstance).toHaveBeenCalled();
    });

    it('populates modal with all form elements', async () => {
        // Act
        await openModal();
        // Assert
        expect(document.querySelector('#stride-create-form')).not.toBeNull();
        expect(document.querySelector('#stride-create-name')).not.toBeNull();
        expect(document.querySelector('#stride-create-iteration')).not.toBeNull();
        expect(document.querySelector('#stride-create-duration')).not.toBeNull();
        expect(document.querySelector('#stride-create-start')).not.toBeNull();
        expect(document.querySelector('#stride-create-end')).not.toBeNull();
        expect(document.querySelector('#stride-create-error')).not.toBeNull();
        expect(document.querySelector('#stride-create-submit')).not.toBeNull();
    });

    it('populates iteration select with options', async () => {
        // Act
        await openModal();
        // Assert
        const select = document.querySelector('#stride-create-iteration') as HTMLSelectElement;
        expect(select.options.length).toBe(2);
        expect(select.options[0].textContent).toBe('Sprint 1');
        expect(select.options[1].textContent).toBe('Sprint 2');
    });

    it('pre-selects the given iterationId', async () => {
        // Act
        await openModal();
        // Assert
        const select = document.querySelector('#stride-create-iteration') as HTMLSelectElement;
        expect(select.value).toBe('5');
    });

    it('sets default duration and date values', async () => {
        // Act
        await openModal();
        // Assert
        const duration = document.querySelector('#stride-create-duration') as HTMLInputElement;
        const start = document.querySelector('#stride-create-start') as HTMLInputElement;
        const end = document.querySelector('#stride-create-end') as HTMLInputElement;
        expect(duration.value).toBe('14');
        expect(start.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(end.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('resets error and submit button on open', async () => {
        // Act
        await openModal();
        // Assert
        const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
        const submitBtn = document.querySelector('#stride-create-submit') as HTMLButtonElement;
        expect(errorEl.textContent).toBe('');
        expect(errorEl.classList.contains('d-none')).toBe(true);
        expect(submitBtn.disabled).toBe(false);
        expect(submitBtn.textContent).toBe('Create Stride');
    });

    it('shows error when name is empty on submit', async () => {
        // Arrange
        await openModal();
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
        expect(errorEl.textContent).toBe('Stride name is required.');
        expect(errorEl.classList.contains('d-none')).toBe(false);
    });

    it('shows error when no iteration selected', async () => {
        // Arrange
        await openModal({ iterationId: 0, iterations: [] });
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = 'My Stride';
        const select = document.querySelector('#stride-create-iteration') as HTMLSelectElement;
        select.value = '0';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
        expect(errorEl.textContent).toBe('Select an iteration for this stride.');
        expect(errorEl.classList.contains('d-none')).toBe(false);
    });

    it('calls createStride and hides modal on success', async () => {
        // Arrange
        mockCreateStride.mockResolvedValue({ id: 1 });
        const onCreated = vi.fn().mockResolvedValue(undefined);
        await openModal({ onCreated });
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = 'Week 1';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockCreateStride).toHaveBeenCalledWith('owner1', 'proj1', expect.objectContaining({
                name: 'Week 1',
                iterationId: 5,
                isActive: true,
            }));
            expect(mockBootstrapModal.getOrCreateInstance().hide).toHaveBeenCalled();
            expect(onCreated).toHaveBeenCalled();
        });
    });

    it('sets submit button to disabled while creating', async () => {
        // Arrange
        let resolveCreate!: (value: unknown) => void;
        mockCreateStride.mockReturnValue(new Promise(resolve => { resolveCreate = resolve; }));
        await openModal();
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = 'Week 1';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const submitBtn = document.querySelector('#stride-create-submit') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(true);
        expect(submitBtn.textContent).toBe('Creating...');
        resolveCreate({ id: 1 });
        await vi.waitFor(() => {
            expect(submitBtn.disabled).toBe(false);
            expect(submitBtn.textContent).toBe('Create Stride');
        });
    });

    it('shows error on API failure', async () => {
        // Arrange
        mockCreateStride.mockRejectedValue(new Error('Name taken'));
        await openModal();
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = 'Duplicate';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
            expect(errorEl.textContent).toBe('Name taken');
            expect(errorEl.classList.contains('d-none')).toBe(false);
        });
    });

    it('shows generic error when error has no message', async () => {
        // Arrange
        mockCreateStride.mockRejectedValue(new Error());
        await openModal();
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = 'Fail';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to create stride.');
        });
    });

    it('trims whitespace from name', async () => {
        // Arrange
        mockCreateStride.mockResolvedValue({ id: 1 });
        await openModal();
        const nameInput = document.querySelector('#stride-create-name') as HTMLInputElement;
        nameInput.value = '   ';
        const form = document.querySelector('#stride-create-form') as HTMLFormElement;
        // Act
        form.dispatchEvent(new Event('submit'));
        // Assert
        const errorEl = document.querySelector('#stride-create-error') as HTMLElement;
        expect(errorEl.textContent).toBe('Stride name is required.');
    });

    it('reuses existing modal on second open', async () => {
        // Arrange
        mockCreateStride.mockResolvedValue({ id: 1 });
        await openModal();
        const modal1 = document.querySelector('#stride-create-modal');
        // Act
        await openModal();
        // Assert
        const modal2 = document.querySelector('#stride-create-modal');
        expect(modal1).toBe(modal2);
    });

    it('handles missing form elements gracefully', async () => {
        // Arrange
        document.body.innerHTML = '<div id="stride-create-modal"><div id="wrong-id"></div></div>';
        const { openStrideCreateModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/stride-create-modal.ts');
        // Act & Assert
        expect(() => openStrideCreateModal({ owner: 'o', project: 'p', iterationId: 1, onCreated: vi.fn() })).not.toThrow();
    });

    it('computes end date when duration changes', async () => {
        // Arrange
        await openModal();
        const startInput = document.querySelector('#stride-create-start') as HTMLInputElement;
        startInput.value = '2024-01-01';
        startInput.dispatchEvent(new Event('change'));
        // Act
        const durationInput = document.querySelector('#stride-create-duration') as HTMLInputElement;
        durationInput.value = '7';
        durationInput.dispatchEvent(new Event('input'));
        // Assert
        const endInput = document.querySelector('#stride-create-end') as HTMLInputElement;
        expect(endInput.value).toBe('2024-01-07');
    });

    it('sets end date based on start date and duration', async () => {
        // Arrange
        await openModal();
        const startInput = document.querySelector('#stride-create-start') as HTMLInputElement;
        const durationInput = document.querySelector('#stride-create-duration') as HTMLInputElement;
        const endInput = document.querySelector('#stride-create-end') as HTMLInputElement;
        startInput.value = '2024-06-01';
        durationInput.value = '10';
        // Act
        startInput.dispatchEvent(new Event('change'));
        // Assert
        expect(endInput.value).toBe('2024-06-10');
    });
});
