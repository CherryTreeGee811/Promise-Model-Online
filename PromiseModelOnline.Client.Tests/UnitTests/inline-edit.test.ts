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
        const { input, view, editBtn } = createElements();
        const api = setupInlineEdit(input, view, editBtn);
        expect(api).toHaveProperty('showView');
        expect(api).toHaveProperty('showSavedPopover');
    });

    it('starts in view mode without optional buttons', () => {
        const { input, view, editBtn } = createElements();
        setupInlineEdit(input, view, editBtn);
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
    });

    it('starts in view mode with optional buttons', () => {
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
        expect(saveBtn.classList.contains('d-none')).toBe(true);
        expect(cancelBtn.classList.contains('d-none')).toBe(true);
    });

    it('edit button click toggles to edit mode', () => {
        const { input, view, editBtn } = createElements();
        setupInlineEdit(input, view, editBtn);
        editBtn.click();
        expect(view.classList.contains('d-none')).toBe(true);
        expect(input.classList.contains('d-none')).toBe(false);
        expect(editBtn.classList.contains('d-none')).toBe(true);
    });

    it('edit click shows save and cancel buttons when provided', () => {
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        editBtn.click();
        expect(saveBtn.classList.contains('d-none')).toBe(false);
        expect(cancelBtn.classList.contains('d-none')).toBe(false);
    });

    it('showView returns to view mode', () => {
        const { input, view, editBtn } = createElements();
        const { showView } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        showView('New Value');
        expect(view.textContent).toBe('New Value');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
    });

    it('showView handles empty value', () => {
        const { input, view, editBtn } = createElements();
        const { showView } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        showView('');
        expect(view.textContent).toBe('');
    });

    it('cancel button restores previous state', () => {
        const { input, view, editBtn, saveBtn, cancelBtn } = createElements();
        setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        editBtn.click();
        input.value = 'changed val';
        cancelBtn.click();
        expect(input.value).toBe('initial val');
        expect(view.textContent).toBe('Display Text');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(editBtn.classList.contains('d-none')).toBe(false);
        expect(saveBtn.classList.contains('d-none')).toBe(true);
        expect(cancelBtn.classList.contains('d-none')).toBe(true);
    });

    it('showSavedPopover without saveButton calls showView directly', () => {
        const { input, view, editBtn } = createElements();
        const { showSavedPopover } = setupInlineEdit(input, view, editBtn);
        editBtn.click();
        showSavedPopover('Direct Save');
        expect(view.textContent).toBe('Direct Save');
        expect(view.classList.contains('d-none')).toBe(false);
        expect(input.classList.contains('d-none')).toBe(true);
    });

    it('showSavedPopover with saveButton shows Saved! then restores', () => {
        const { input, view, editBtn, saveBtn } = createElements();
        const { showSavedPopover } = setupInlineEdit(input, view, editBtn, saveBtn);
        editBtn.click();
        showSavedPopover('Final Value');
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
        const input = document.createElement('input') as HTMLInputElement;
        input.value = 'val';
        const view = document.createElement('span');
        view.textContent = '';
        const editBtn = document.createElement('button');
        const cancelBtn = document.createElement('button');
        document.body.append(input, view, editBtn, cancelBtn);
        setupInlineEdit(input, view, editBtn, undefined, cancelBtn);
        editBtn.click();
        cancelBtn.click();
        expect(view.textContent).toBe('');
        expect(input.classList.contains('d-none')).toBe(true);
        expect(view.classList.contains('d-none')).toBe(false);
    });
});
