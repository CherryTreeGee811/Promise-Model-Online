import { describe, it, expect, beforeEach } from 'vitest';
import { renderLoadingSpinner, ensureModal, createConfirmationPromise } from '../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts';

describe('renderLoadingSpinner', () => {
    it('returns a DOM element', () => {
        const el = renderLoadingSpinner('Loading...');
        expect(el).toBeInstanceOf(HTMLElement);
    });

    it('includes the aria-label on the spinner', () => {
        const el = renderLoadingSpinner('Please wait...');
        const spinner = el.querySelector('.spinner-border') as HTMLElement;
        expect(spinner).not.toBeNull();
        expect(spinner.getAttribute('aria-label')).toBe('Please wait...');
    });

    it('includes the visually-hidden text', () => {
        const el = renderLoadingSpinner('Loading data...');
        const srSpan = el.querySelector('.visually-hidden') as HTMLElement;
        expect(srSpan).not.toBeNull();
        expect(srSpan.textContent).toBe('Loading data...');
    });

    it('has aria-live="polite"', () => {
        const el = renderLoadingSpinner('test');
        expect(el.getAttribute('aria-live')).toBe('polite');
    });
});

describe('ensureModal', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('creates a modal element from markup when not in DOM', () => {
        const modal = ensureModal('test-modal', '<div id="test-modal" class="modal">content</div>');
        expect(modal).not.toBeNull();
        expect(modal!.id).toBe('test-modal');
        expect(document.body.contains(modal)).toBe(true);
    });

    it('returns existing modal element without re-creating', () => {
        const existing = document.createElement('div');
        existing.id = 'existing-modal';
        document.body.append(existing);

        const modal = ensureModal('existing-modal', '<div id="existing-modal">new</div>');
        expect(modal).toBe(existing);
    });

    it('trims whitespace from markup', () => {
        const modal = ensureModal('trimmed-modal', '  <div id="trimmed-modal">ok</div>  ');
        expect(modal).not.toBeNull();
        expect(modal!.id).toBe('trimmed-modal');
    });

    it('returns null for empty markup', () => {
        const modal = ensureModal('empty-modal', '');
        expect(modal).toBeNull();
    });
});

describe('createConfirmationPromise', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        (globalThis as Record<string, unknown>).bootstrap = undefined;
    });

    it('returns a promise', () => {
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        expect(promise).toBeInstanceOf(Promise);
    });

    it('resolves true when confirm button is clicked', async () => {
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        btn.click();
        await expect(promise).resolves.toBe(true);
    });

    it('resolves false when dismissed via hidden.bs.modal event', async () => {
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        modal.dispatchEvent(new Event('hidden.bs.modal'));
        await expect(promise).resolves.toBe(false);
    });

    it('resolves only once (first event wins)', async () => {
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.append(modal);
        const btn = document.createElement('button');
        btn.id = 'confirm-btn';
        modal.append(btn);

        const promise = createConfirmationPromise(modal, btn);
        btn.click();
        modal.dispatchEvent(new Event('hidden.bs.modal'));
        await expect(promise).resolves.toBe(true);
    });
});
