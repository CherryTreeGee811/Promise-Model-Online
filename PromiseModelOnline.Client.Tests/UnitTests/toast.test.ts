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
        // Arrange
        showToast('Hello');
        // Act
        const container = document.querySelector('#pmo-toast-container');
        // Assert
        expect(container).not.toBeNull();
        expect(container!.children.length).toBe(1);
    });

    it('displays the message text', () => {
        // Arrange
        showToast('Test message');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.textContent).toContain('Test message');
    });

    it('creates the container on first use', () => {
        // Assert
        expect(document.querySelector('#pmo-toast-container')).toBeNull();
        showToast('First');
        expect(document.querySelector('#pmo-toast-container')).not.toBeNull();
    });

    it('reuses existing container on subsequent calls', () => {
        // Arrange
        showToast('First');
        showToast('Second');
        // Act
        const container = document.querySelector('#pmo-toast-container')!;
        // Assert
        expect(container.children.length).toBe(2);
    });

    it('applies the correct CSS class for type info', () => {
        // Arrange
        showToast('Info', 'info');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.classList.contains('bg-info')).toBe(true);
    });

    it('applies the correct CSS class for type error', () => {
        // Arrange
        showToast('Error', 'error');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.classList.contains('bg-danger')).toBe(true);
    });

    it('applies the correct CSS class for type success', () => {
        // Arrange
        showToast('Success', 'success');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.classList.contains('bg-success')).toBe(true);
    });

    it('applies the correct CSS class for type warning', () => {
        // Arrange
        showToast('Warning', 'warning');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.classList.contains('bg-warning')).toBe(true);
    });

    it('removes toast after duration', () => {
        // Act
        showToast('Auto dismiss', 'info', 1000);
        // Assert
        expect(document.querySelectorAll('.toast').length).toBe(1);

        vi.advanceTimersByTime(1300);
        expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    it('does not auto-remove sticky toast (duration 0)', () => {
        // Act
        showToast('Sticky', 'info', 0);
        // Assert
        expect(document.querySelectorAll('.toast').length).toBe(1);

        vi.advanceTimersByTime(10000);
        expect(document.querySelectorAll('.toast').length).toBe(1);
    });

    it('removes toast when close button is clicked', () => {
        // Arrange
        showToast('Closable');
        // Act
        const closeBtn = document.querySelector('.btn-close') as HTMLElement;
        // Assert
        expect(closeBtn).not.toBeNull();

        closeBtn.click();
        vi.advanceTimersByTime(300);
        expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    it('includes an icon element', () => {
        // Arrange
        showToast('Has icon');
        // Act
        const icon = document.querySelector('.toast i');
        // Assert
        expect(icon).not.toBeNull();
    });

    it('has role="alert" on the toast', () => {
        // Arrange
        showToast('Alert');
        // Act
        const toast = document.querySelector('.toast');
        // Assert
        expect(toast!.getAttribute('role')).toBe('alert');
    });
});
