import { describe, it, expect, beforeEach, vi, afterEach, useFakeTimers } from 'vitest';
import { showToast } from '../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts';

describe('showToast', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('appends a toast element to the container', () => {
        showToast('Hello');
        const container = document.querySelector('#pmo-toast-container');
        expect(container).not.toBeNull();
        expect(container!.children.length).toBe(1);
    });

    it('displays the message text', () => {
        showToast('Test message');
        const toast = document.querySelector('.toast');
        expect(toast!.textContent).toContain('Test message');
    });

    it('creates the container on first use', () => {
        expect(document.querySelector('#pmo-toast-container')).toBeNull();
        showToast('First');
        expect(document.querySelector('#pmo-toast-container')).not.toBeNull();
    });

    it('reuses existing container on subsequent calls', () => {
        showToast('First');
        showToast('Second');
        const container = document.querySelector('#pmo-toast-container')!;
        expect(container.children.length).toBe(2);
    });

    it('applies the correct CSS class for type info', () => {
        showToast('Info', 'info');
        const toast = document.querySelector('.toast');
        expect(toast!.classList.contains('bg-info')).toBe(true);
    });

    it('applies the correct CSS class for type error', () => {
        showToast('Error', 'error');
        const toast = document.querySelector('.toast');
        expect(toast!.classList.contains('bg-danger')).toBe(true);
    });

    it('applies the correct CSS class for type success', () => {
        showToast('Success', 'success');
        const toast = document.querySelector('.toast');
        expect(toast!.classList.contains('bg-success')).toBe(true);
    });

    it('applies the correct CSS class for type warning', () => {
        showToast('Warning', 'warning');
        const toast = document.querySelector('.toast');
        expect(toast!.classList.contains('bg-warning')).toBe(true);
    });

    it('removes toast after duration', () => {
        showToast('Auto dismiss', 'info', 1000);
        expect(document.querySelectorAll('.toast').length).toBe(1);

        vi.advanceTimersByTime(1300);
        expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    it('does not auto-remove sticky toast (duration 0)', () => {
        showToast('Sticky', 'info', 0);
        expect(document.querySelectorAll('.toast').length).toBe(1);

        vi.advanceTimersByTime(10000);
        expect(document.querySelectorAll('.toast').length).toBe(1);
    });

    it('removes toast when close button is clicked', () => {
        showToast('Closable');
        const closeBtn = document.querySelector('.btn-close') as HTMLElement;
        expect(closeBtn).not.toBeNull();

        closeBtn.click();
        vi.advanceTimersByTime(300);
        expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    it('includes an icon element', () => {
        showToast('Has icon');
        const icon = document.querySelector('.toast i');
        expect(icon).not.toBeNull();
    });

    it('has role="alert" on the toast', () => {
        showToast('Alert');
        const toast = document.querySelector('.toast');
        expect(toast!.getAttribute('role')).toBe('alert');
    });
});
