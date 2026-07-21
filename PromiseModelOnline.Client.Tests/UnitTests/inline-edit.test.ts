import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupInlineEdit } from '../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts';

describe('setupInlineEdit', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function createElements() {
        const input = document.createElement('input') as HTMLInputElement;
        input.value = 'initial val';
        const view = document.createElement('span');
        view.textContent = 'Display Text';
        const editBtn = document.createElement('button');
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        return { input, view, editBtn, saveBtn, cancelBtn };
    }

    it('returns showView and showSavedPopover methods', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        // Act
        const api = setupInlineEdit(input, view, editBtn);
        // Assert
        expect(api).toHaveProperty('showView');
        expect(api).toHaveProperty('showSavedPopover');
    });

    it('starts in view mode without optional buttons', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        // Act
        setupInlineEdit(input, view, editBtn);
        // Assert
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
    });

    it('starts in view mode with optional buttons', () => {
        // Arrange
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        // Act
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        // Assert
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
        expect(saveBtn.classList.contains('d-none')).toBe(true);
        expect(cancelBtn.classList.contains('d-none')).toBe(true);
    });

    it('edit button click toggles to edit mode', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        setupInlineEdit(input, view, editBtn);
        // Act
        editBtn.click();
        // Assert
        expect(view.classList.contains('d-none')).toBe(true);
        expect(input.classList.contains('d-none')).toBe(false);
        expect(editBtn.classList.contains('d-none')).toBe(true);
    });

    it('edit click shows save and cancel buttons when provided', () => {
        // Arrange
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        // Act
        editBtn.click();
        // Assert
        expect(saveBtn.classList.contains('d-none')).toBe(false);
        expect(cancelBtn.classList.contains('d-none')).toBe(false);
    });

    it('showView returns to view mode', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        const { showView } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        // Act
        showView('New Value');
        // Assert
        expect(view.textContent).toBe('New Value');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
    });

    it('showView handles empty value', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        const { showView } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        // Act
        showView('');
        // Assert
        expect(view.textContent).toBe('');
    });

    it('cancel button restores previous state', () => {
        // Arrange
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        editBtn.click();
        input.value = 'changed val';
        // Act
        cancelBtn.click();
        // Assert
        expect(input.value).toBe('initial val');
        expect(view.textContent).toBe('Display Text');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
        expect(saveBtn.classList.contains('d-none')).toBe(true);
        expect(cancelBtn.classList.contains('d-none')).toBe(true);
    });

    it('showSavedPopover without saveButton calls showView directly', () => {
        // Arrange
        const { input, view, editBtn } = createElements();
        const { showSavedPopover } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        // Act
        showSavedPopover('Direct Save');
        // Assert
        expect(view.textContent).toBe('Direct Save');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
    });

    it('showSavedPopover with saveButton shows Saved! then restores', () => {
        // Arrange
        const { input, view, editBtn, saveBtn } = createElements();
        const { showSavedPopover } = setupInlineEdit(input, view, editBtn, saveBtn);
        editBtn.click();
        // Act
        showSavedPopover('Final Value');
        // Assert
        expect(saveBtn.textContent).toBe('Saved!');
        expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
        vi.advanceTimersByTime(1500);
        expect(saveBtn.textContent).toBe('Save');
        expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
        expect(view.textContent).toBe('Final Value');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
    });

    it('handles empty view textContent in showEdit (|| fallback)', () => {
        // Arrange
        const input = document.createElement('input') as HTMLInputElement;
        input.value = 'val';
        const view = document.createElement('span');
        view.textContent = '';
        const editBtn = document.createElement('button');
        const cancelBtn = document.createElement('button');
        document.body.append(input, view, editBtn, cancelBtn);
        setupInlineEdit(input, view, editBtn, undefined, cancelBtn);
        editBtn.click();
        // Act
        cancelBtn.click();
        // Assert
        expect(view.textContent).toBe('');
        expect(input.classList.contains('d-none')).toBe(true);
        expect(view.classList.contains('d-none')).toBe(false);
    });
});
