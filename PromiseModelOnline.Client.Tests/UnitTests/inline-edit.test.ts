import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInlineEdit } from '../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts';

describe('setupInlineEdit', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        (globalThis as Record<string, unknown>).bootstrap = { Popover: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn(), destroy: vi.fn() }) };
    });

    it('returns showView and showSavedPopover methods', () => {
        const input = document.createElement('input');
        input.style.display = 'none';
        const view = document.createElement('span');
        view.textContent = 'hello';
        const editBtn = document.createElement('button');
        document.body.append(input, view, editBtn);

        const result = setupInlineEdit(input, view, editBtn);
        expect(result).toHaveProperty('showView');
        expect(result).toHaveProperty('showSavedPopover');
    });

    it('toggles between view and edit modes on edit button click', () => {
        const input = document.createElement('input');
        const view = document.createElement('span');
        view.textContent = 'hello';
        const editBtn = document.createElement('button');
        document.body.append(input, view, editBtn);

        setupInlineEdit(input, view, editBtn);
        expect(input.classList.contains('d-none')).toBe(true);
        expect(view.classList.contains('d-none')).toBe(false);

        editBtn.click();
        expect(input.classList.contains('d-none')).toBe(false);
        expect(view.classList.contains('d-none')).toBe(true);
    });

    it('accepts optional cancel and save buttons', () => {
        const input = document.createElement('input');
        input.style.display = 'none';
        const view = document.createElement('span');
        const editBtn = document.createElement('button');
        const cancelBtn = document.createElement('button');
        const saveBtn = document.createElement('button');
        document.body.append(input, view, editBtn, cancelBtn, saveBtn);

        const result = setupInlineEdit(input, view, editBtn, saveBtn, cancelBtn);
        expect(result).toHaveProperty('showView');
    });
});
