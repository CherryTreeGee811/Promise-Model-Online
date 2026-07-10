import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSearchUsers = vi.fn();
const mockSearchPromises = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.api.ts', () => ({
    searchUsers: mockSearchUsers,
    searchPromises: mockSearchPromises,
}));

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('createCommentAutocomplete', () => {
    let textarea: HTMLTextAreaElement;
    let controller: { destroy: () => void } | null;

    beforeEach(() => {
        textarea = document.createElement('textarea');
        textarea.value = '';
        document.body.append(textarea);
        controller = null;
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (controller) controller.destroy();
        textarea.remove();
        // Clean up any leaked dropdowns from non-destroyed controllers
        for (const el of document.querySelectorAll('.comment-autocomplete')) {
            el.remove();
        }
    });

    it('returns controller with destroy method', async () => {
        // Arrange
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        // Act
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        // Assert
        expect(controller).toHaveProperty('destroy');
    });

    it('creates dropdown element and appends to body', async () => {
        // Arrange
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        // Act
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        // Assert
        const dropdown = document.querySelector('.comment-autocomplete');
        expect(dropdown).not.toBeNull();
        expect(dropdown!.classList.contains('d-none')).toBe(true);
    });

    it('searches users on @ trigger', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        mockSearchPromises.mockResolvedValue([]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = 'hello @j';
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;
        // Act
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        // Assert
        expect(mockSearchUsers).toHaveBeenCalledWith('Moment', '100', 'j');
    });

    it('searches promises on # trigger', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([]);
        mockSearchPromises.mockResolvedValue([{ entityType: 'Promise', sequenceNumber: 1, statement: 'Test promise' }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = 'ref #t';
        textarea.selectionStart = 6;
        textarea.selectionEnd = 6;
        // Act
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        // Assert
        expect(mockSearchPromises).toHaveBeenCalledWith('Moment', '100', 't');
    });

    it('shows dropdown when results are returned', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        // Act
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        // Assert
        const dropdown = document.querySelector('.comment-autocomplete')!;
        expect(dropdown.classList.contains('d-none')).toBe(false);
    });

    it('keeps dropdown hidden when no results', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@x';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        // Act
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        // Assert
        const dropdown = document.querySelector('.comment-autocomplete')!;
        expect(dropdown.classList.contains('d-none')).toBe(true);
    });

    it('closes dropdown on Escape key', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        // Assert
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(true);
    });

    it('selects highlighted item on Enter', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        // Assert
        expect(textarea.value).toContain('@jdoe');
    });

    it('selects highlighted item on Tab', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        // Assert
        expect(textarea.value).toContain('@jdoe');
    });

    it('highlights next item on ArrowDown', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'alice', userId: 1 }, { name: 'bob', userId: 2 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@';
        textarea.selectionStart = 1;
        textarea.selectionEnd = 1;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.children.length).toBe(2);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        // Assert
        const items = document.querySelectorAll('.comment-autocomplete__item');
        expect(items[0].classList.contains('comment-autocomplete__item--highlight')).toBe(false);
        expect(items[1].classList.contains('comment-autocomplete__item--highlight')).toBe(true);
    });

    it('highlights previous item on ArrowUp', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'alice', userId: 1 }, { name: 'bob', userId: 2 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@';
        textarea.selectionStart = 1;
        textarea.selectionEnd = 1;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.children.length).toBe(2);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        // Assert
        const items = document.querySelectorAll('.comment-autocomplete__item');
        expect(items[items.length - 1].classList.contains('comment-autocomplete__item--highlight')).toBe(true);
    });

    it('closes dropdown on outside click', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        document.body.click();
        // Assert
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(true);
    });

    it('selects item on mousedown', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        const firstItem = document.querySelector('.comment-autocomplete__item') as HTMLElement;
        expect(firstItem).not.toBeNull();
        // Act
        firstItem.dispatchEvent(new MouseEvent('mousedown'));
        // Assert
        expect(textarea.value).toContain('@jdoe');
    });

    it('destroy removes event listeners and dropdown', async () => {
        // Arrange
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        // Act
        controller.destroy();
        // Assert
        expect(document.querySelector('.comment-autocomplete')).toBeNull();
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(mockSearchUsers).not.toHaveBeenCalled();
    });

    it('closes dropdown on blur after delay', async () => {
        // Arrange
        mockSearchUsers.mockResolvedValue([{ name: 'jdoe', userId: 1 }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        textarea.dispatchEvent(new Event('blur'));
        await delay(200);
        // Assert
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(true);
    });

    it('inserts promise reference on # selection', async () => {
        // Arrange
        mockSearchPromises.mockResolvedValue([{ entityType: 'Promise', sequenceNumber: 5, statement: 'Test' }]);
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '#t';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        expect(document.querySelector('.comment-autocomplete')!.classList.contains('d-none')).toBe(false);
        // Act
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        // Assert
        expect(textarea.value).toContain('#Promise-5');
    });

    it('handles API error gracefully during search', async () => {
        // Arrange
        mockSearchUsers.mockRejectedValue(new Error('network error'));
        const { createCommentAutocomplete } = await import('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts');
        controller = createCommentAutocomplete(textarea, 'Moment', '100');
        textarea.value = '@j';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        // Act
        textarea.dispatchEvent(new Event('input'));
        await delay(300);
        // Assert
        const dropdown = document.querySelector('.comment-autocomplete')!;
        expect(dropdown.classList.contains('d-none')).toBe(true);
    });
});
