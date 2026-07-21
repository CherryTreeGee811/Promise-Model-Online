import { describe, it, expect, beforeEach } from 'vitest';
import { renderLoadingSpinner, ensureModal, createConfirmationPromise } from '../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts';

describe('renderLoadingSpinner', () => {
    it('returns a DOM element', () => {
        // Act
        const el = renderLoadingSpinner('Loading...');
        // Assert
        expect(el).toBeInstanceOf(HTMLElement);
    });

    it('includes the aria-label on the spinner', () => {
        // Arrange
        const el = renderLoadingSpinner('Please wait...');
        // Act
        const spinner = el.querySelector('.spinner-border') as HTMLElement;
        // Assert
        expect(spinner).not.toBeNull();
        expect(spinner.getAttribute('aria-label')).toBe('Please wait...');
    });

    it('includes the visually-hidden text', () => {
        // Arrange
        const el = renderLoadingSpinner('Loading data...');
        // Act
        const srSpan = el.querySelector('.visually-hidden') as HTMLElement;
        // Assert
        expect(srSpan).not.toBeNull();
        expect(srSpan.textContent).toBe('Loading data...');
    });

    it('has aria-live="polite"', () => {
        // Act
        const el = renderLoadingSpinner('test');
        // Assert
        expect(el.getAttribute('aria-live')).toBe('polite');
    });
});

describe('ensureModal', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('creates a modal element from markup when not in DOM', () => {
        // Act
        const modal = ensureModal('test-modal', '<div id="test-modal" class="modal">content</div>');
        // Assert
        expect(modal).not.toBeNull();
        expect(modal!.id).toBe('test-modal');
        expect(document.body.contains(modal)).toBe(true);
    });

    it('returns existing modal element without re-creating', () => {
        // Arrange
        const existing = document.createElement('div');
        existing.id = 'existing-modal';
        document.body.append(existing);

        // Act
        const modal = ensureModal('existing-modal', '<div id="existing-modal">new</div>');
        // Assert
        expect(modal).toBe(existing);
    });

    it('trims whitespace from markup', () => {
        // Act
        const modal = ensureModal('trimmed-modal', '  <div id="trimmed-modal">ok</div>  ');
        // Assert
        expect(modal).not.toBeNull();
        expect(modal!.id).toBe('trimmed-modal');
    });

    it('returns null for empty markup', () => {
        // Act
        const modal = ensureModal('empty-modal', '');
        // Assert
        expect(modal).toBeNull();
    });
});

describe('createConfirmationPromise', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        (globalThis as Record<string, unknown>).bootstrap = undefined;
    });

    it('returns a promise', () => {
        // Arrange
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        // Act
        const promise = createConfirmationPromise(modal, btn);
        // Assert
        expect(promise).toBeInstanceOf(Promise);
    });

    it('resolves true when confirm button is clicked', async () => {
        // Arrange
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        // Act
        btn.click();
        // Assert
        await expect(promise).resolves.toBe(true);
    });

    it('resolves false when dismissed via hidden.bs.modal event', async () => {
        // Arrange
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        // Act
        modal.dispatchEvent(new Event('hidden.bs.modal'));
        // Assert
        await expect(promise).resolves.toBe(false);
    });

    it('resolves only once (first event wins)', async () => {
        // Arrange
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        btn.click();
        // Act
        modal.dispatchEvent(new Event('hidden.bs.modal'));
        // Assert
        await expect(promise).resolves.toBe(true);
    });
});
