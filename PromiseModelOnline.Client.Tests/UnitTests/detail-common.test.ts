import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

beforeAll(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>mock</div>'),
    });
    Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/test', assign: vi.fn() },
        writable: true,
    });
});

import { createStatusRow, createDateRow, gateDetailControls, setElementVisibility, setElementText, initBackLink, buildInlineEditUI, setupDetailInlineEdit, setupDescriptionHandler, bindLinkClickHandlers, loadCommentsAndReactions } from '../../PromiseModelOnline.Client/wwwroot/js/utils/detail-common.ts';
import { setupInlineEdit } from '../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts';
import { loadComments } from '../../PromiseModelOnline.Client/wwwroot/js/comments/comments.ts';
import { loadReactions } from '../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts', async (importOriginal) => {
    const actual = await importOriginal() as typeof import('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts');
    return {
        ...actual,
        setupInlineEdit: vi.fn(() => ({ destroy: vi.fn() })),
    };
});

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts', async (importOriginal) => {
    const actual = await importOriginal() as typeof import('../../PromiseModelOnline.Client/wwwroot/js/reactions/reactions.ts');
    return {
        ...actual,
        loadReactions: vi.fn(),
    };
});

describe('createStatusRow', () => {
    it('returns a table row element', () => {
        // Arrange
        // Act
        const row = createStatusRow('green');
        // Assert
        expect(row.tagName).toBe('TR');
    });

    it('contains a scope="row" th with text "Status"', () => {
        // Arrange
        const row = createStatusRow('green');
        // Act
        const th = row.querySelector('th');
        // Assert
        expect(th).not.toBeNull();
        expect(th!.getAttribute('scope')).toBe('row');
        expect(th!.textContent).toBe('Status');
    });

    it('includes the status icon based on color', () => {
        // Arrange
        const row = createStatusRow('green');
        // Act
        const iconSpan = row.querySelector('span[aria-hidden="true"]');
        // Assert
        expect(iconSpan).not.toBeNull();
        expect(iconSpan!.textContent).toBe('🟢');
    });

    it('includes the status label based on color', () => {
        // Arrange
        const row = createStatusRow('red');
        // Act
        const srSpan = row.querySelector('.sr-only');
        // Assert
        expect(srSpan).not.toBeNull();
        expect(srSpan!.textContent.length).toBeGreaterThan(0);
    });

    it('handles undefined status color', () => {
        // Arrange
        const row = createStatusRow(undefined);
        // Act
        const srSpan = row.querySelector('.sr-only');
        // Assert
        expect(srSpan).not.toBeNull();
        expect(srSpan!.textContent.length).toBeGreaterThan(0);
    });
});

describe('createDateRow', () => {
    it('returns a table row element', () => {
        // Arrange
        // Act
        const row = createDateRow('Created');
        // Assert
        expect(row.tagName).toBe('TR');
    });

    it('contains a scope="row" th with the label text', () => {
        // Arrange
        const row = createDateRow('Updated');
        // Act
        const th = row.querySelector('th');
        // Assert
        expect(th).not.toBeNull();
        expect(th!.getAttribute('scope')).toBe('row');
        expect(th!.textContent).toBe('Updated');
    });

    it('formats a date string', () => {
        // Arrange
        const row = createDateRow('Created', '2026-06-01');
        // Act
        const td = row.querySelector('td');
        // Assert
        expect(td!.textContent).toMatch(/2026/);
    });

    it('uses en-dash for undefined date', () => {
        // Arrange
        const row = createDateRow('Created', undefined);
        // Act
        const td = row.querySelector('td');
        // Assert
        expect(td!.textContent).toBe('\u2013');
    });

    it('uses en-dash for empty date string', () => {
        // Arrange
        const row = createDateRow('Created', '');
        // Act
        const td = row.querySelector('td');
        // Assert
        expect(td!.textContent).toBe('\u2013');
    });
});

describe('gateDetailControls', () => {
    beforeEach(() => {
        vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('disables elements when permission is not Edit', () => {
        // Arrange
        const mockEl = { disabled: false, title: '' } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        gateDetailControls({ permission: 'Read' }, ['.some-selector']);
        // Assert
        expect(mockEl.disabled).toBe(true);
        expect(mockEl.title).toBe('Requires Edit permission.');
    });

    it('does nothing when permission is Edit', () => {
        // Arrange
        const mockEl = { disabled: false, title: '' } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        gateDetailControls({ permission: 'Edit' }, ['.some-selector']);
        // Assert
        expect(mockEl.disabled).not.toBe(true);
    });

    it('handles null permission', () => {
        // Arrange
        const mockEl = { disabled: false, title: '' } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        gateDetailControls(null, ['.some-selector']);
        // Assert
        expect(mockEl.disabled).toBe(true);
    });

    it('handles undefined permission', () => {
        // Arrange
        const mockEl = { disabled: false, title: '' } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        gateDetailControls(undefined, ['.some-selector']);
        // Assert
        expect(mockEl.disabled).toBe(true);
    });
});

describe('setElementVisibility', () => {
    beforeEach(() => {
        vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('hides element', () => {
        // Arrange
        const mockEl = { style: { display: '' } } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        setElementVisibility('#test', true);
        // Assert
        expect(mockEl.style.display).toBe('none');
    });

    it('shows element', () => {
        // Arrange
        const mockEl = { style: { display: 'none' } } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        setElementVisibility('#test', false);
        // Assert
        expect(mockEl.style.display).toBe('');
    });

    it('handles missing element', () => {
        // Arrange
        (document.querySelector as any).mockReturnValue(null);
        // Act & Assert
        expect(() => setElementVisibility('#test', true)).not.toThrow();
    });
});

describe('setElementText', () => {
    beforeEach(() => {
        vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sets text content', () => {
        // Arrange
        const mockEl = { textContent: '' } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        setElementText('#test', 'hello');
        // Assert
        expect(mockEl.textContent).toBe('hello');
    });

    it('handles missing element', () => {
        // Arrange
        (document.querySelector as any).mockReturnValue(null);
        // Act & Assert
        expect(() => setElementText('#test', 'hello')).not.toThrow();
    });
});

describe('initBackLink', () => {
    beforeEach(() => {
        vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('adds click listener to back-link', () => {
        // Arrange
        const mockEl = { addEventListener: vi.fn() } as any;
        (document.querySelector as any).mockReturnValue(mockEl);
        // Act
        initBackLink();
        // Assert
        expect(mockEl.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('handles missing back-link', () => {
        // Arrange
        (document.querySelector as any).mockReturnValue(null);
        // Act & Assert
        expect(() => initBackLink()).not.toThrow();
    });
});

describe('buildInlineEditUI', () => {
    it('creates all UI elements inside a td', () => {
        // Arrange
        const td = document.createElement('td');
        // Act
        const result = buildInlineEditUI(td, 'test-', 'hello');
        // Assert
        expect(result.descTextarea).toBeInstanceOf(HTMLElement);
        expect(result.cancelButton).toBeInstanceOf(HTMLElement);
        expect(result.saveButton).toBeInstanceOf(HTMLElement);
        expect(result.saveMessage).toBeInstanceOf(HTMLElement);
        expect(result.descTextarea.tagName).toBe('TEXTAREA');
        expect(result.cancelButton.tagName).toBe('BUTTON');
        expect(result.saveButton.tagName).toBe('BUTTON');
        expect(result.saveMessage.tagName).toBe('SPAN');
    });

    it('renders description text', () => {
        // Arrange
        const td = document.createElement('td');
        const result = buildInlineEditUI(td, 'test-', 'hello');
        // Act
        const view = td.querySelector('#test-description-view');
        // Assert
        expect(view).not.toBeNull();
        expect(view!.textContent).toContain('hello');
    });

    it('handles empty description', () => {
        // Arrange
        const td = document.createElement('td');
        // Act & Assert
        expect(() => buildInlineEditUI(td, 'test-', '')).not.toThrow();
    });

    it('handles null/undefined description', () => {
        // Arrange
        const td = document.createElement('td');
        // Act & Assert
        expect(() => buildInlineEditUI(td, 'test-', null as unknown as string)).not.toThrow();
        const td2 = document.createElement('td');
        expect(() => buildInlineEditUI(td2, 'test-', undefined as unknown as string)).not.toThrow();
    });
});

describe('setupDetailInlineEdit', () => {
    let querySelectorSpy: any;

    beforeEach(() => {
        querySelectorSpy = vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns undefined when input element is missing', () => {
        // Arrange
        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#input') return null;
            if (sel === '#view') return document.createElement('div');
            if (sel === '#edit') return document.createElement('button');
            return null;
        });
        // Act & Assert
        expect(setupDetailInlineEdit('#input', '#view', '#edit', 'epic', 1)).toBeUndefined();
    });

    it('returns undefined when view element is missing', () => {
        // Arrange
        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#input') return document.createElement('textarea');
            if (sel === '#view') return null;
            if (sel === '#edit') return document.createElement('button');
            return null;
        });
        // Act & Assert
        expect(setupDetailInlineEdit('#input', '#view', '#edit', 'epic', 1)).toBeUndefined();
    });

    it('returns undefined when edit button is missing', () => {
        // Arrange
        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#input') return document.createElement('textarea');
            if (sel === '#view') return document.createElement('div');
            if (sel === '#edit') return null;
            return null;
        });
        // Act & Assert
        expect(setupDetailInlineEdit('#input', '#view', '#edit', 'epic', 1)).toBeUndefined();
    });

    it('calls setupInlineEdit when all elements found (with save/cancel selectors)', () => {
        // Arrange
        const inputEl = document.createElement('textarea');
        const viewEl = document.createElement('div');
        const editEl = document.createElement('button');
        const saveEl = document.createElement('button');
        const cancelEl = document.createElement('button');
        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#input') return inputEl;
            if (sel === '#view') return viewEl;
            if (sel === '#edit') return editEl;
            if (sel === '#save') return saveEl;
            if (sel === '#cancel') return cancelEl;
            return null;
        });

        // Act
        const result = setupDetailInlineEdit('#input', '#view', '#edit', 'epic', 1, '#save', '#cancel');
        // Assert
        expect(setupInlineEdit).toHaveBeenCalledWith(inputEl, viewEl, editEl, saveEl, cancelEl);
        expect(result).toEqual({ destroy: expect.any(Function) });
    });

    it('calls setupInlineEdit without save/cancel selectors', () => {
        // Arrange
        const inputEl = document.createElement('textarea');
        const viewEl = document.createElement('div');
        const editEl = document.createElement('button');
        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#input') return inputEl;
            if (sel === '#view') return viewEl;
            if (sel === '#edit') return editEl;
            return null;
        });

        // Act
        const result = setupDetailInlineEdit('#input', '#view', '#edit', 'epic', 1);
        // Assert
        expect(setupInlineEdit).toHaveBeenCalledWith(inputEl, viewEl, editEl, undefined, undefined);
        expect(result).toEqual({ destroy: expect.any(Function) });
    });
});

describe('setupDescriptionHandler', () => {
    let saveButton: HTMLButtonElement;
    let descMessage: HTMLSpanElement;
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
        saveButton = document.createElement('button');
        saveButton.id = 'save-desc';
        document.body.append(saveButton);

        descMessage = document.createElement('span');
        descMessage.id = 'desc-save-msg';
        document.body.append(descMessage);

        textarea = document.createElement('textarea');
        textarea.id = 'description-input';
        document.body.append(textarea);

        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('does nothing when save button is missing', () => {
        // Arrange
        document.body.innerHTML = '';
        const updateFn = vi.fn();
        // Act & Assert
        expect(() => setupDescriptionHandler('owner', 'proj', '1', 'epic', { sequenceNumber: 1 }, updateFn)).not.toThrow();
        expect(updateFn).not.toHaveBeenCalled();
    });

    it('handles missing descMessage on save button click', async () => {
        // Arrange
        document.getElementById('desc-save-msg')?.remove();
        const updateFn = vi.fn().mockResolvedValue({ description: 'new' });
        const entity = { sequenceNumber: 1 };
        setupDescriptionHandler('owner', 'proj', '1', 'epic', entity, updateFn);

        saveButton.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(updateFn).toHaveBeenCalledWith('owner', 'proj', '1', '');
        });
    });

    it('calls updateFunction on save button click', async () => {
        // Arrange
        textarea.value = 'new desc';
        const updateFn = vi.fn().mockResolvedValue({ description: 'new' });
        const entity = { sequenceNumber: 1 };
        setupDescriptionHandler('owner', 'proj', '1', 'epic', entity, updateFn);

        saveButton.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(updateFn).toHaveBeenCalledWith('owner', 'proj', '1', 'new desc');
        });
    });

    it('handles successful update', async () => {
        // Arrange
        textarea.value = 'new desc';
        const updateFn = vi.fn().mockResolvedValue({ description: 'new desc' });
        const entity = { sequenceNumber: 1 };
        setupDescriptionHandler('owner', 'proj', '1', 'epic', entity, updateFn);

        saveButton.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(entity.description).toBe('new desc');
            expect(descMessage.textContent).toBe('');
            expect(saveButton.disabled).toBe(false);
        });
    });

    it('handles editor.showSavedPopover on successful update', async () => {
        // Arrange
        textarea.value = 'desc';
        const showSavedPopover = vi.fn();
        const updateFn = vi.fn().mockResolvedValue({ description: 'desc' });
        const entity = { sequenceNumber: 1, __editor: { showSavedPopover } } as any;
        setupDescriptionHandler('owner', 'proj', '1', 'epic', entity, updateFn);

        saveButton.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(showSavedPopover).toHaveBeenCalled();
        });
    });

    it('shows Save failed on API failure', async () => {
        // Arrange
        const updateFn = vi.fn().mockRejectedValue(new Error('API error'));
        const entity = { sequenceNumber: 1 };
        setupDescriptionHandler('owner', 'proj', '1', 'epic', entity, updateFn);

        saveButton.click();
        // Act
        await vi.waitFor(() => {
            // Assert
            expect(descMessage.textContent).toBe('Save failed');
            expect(saveButton.disabled).toBe(false);
        });
    });
});

describe('bindLinkClickHandlers', () => {
    it('adds click event listeners to matching links', () => {
        // Arrange
        const container = document.createElement('div');
        const link1 = document.createElement('a');
        link1.setAttribute('data-seq', '1');
        container.appendChild(link1);
        const link2 = document.createElement('a');
        link2.setAttribute('data-seq', '2');
        container.appendChild(link2);

        const addEventListenerSpy1 = vi.spyOn(link1, 'addEventListener');
        const addEventListenerSpy2 = vi.spyOn(link2, 'addEventListener');

        // Act
        bindLinkClickHandlers(container, 'a[data-seq]', 'data-seq', 'journeys', 'owner', 'project', document.createElement('div'), document.createElement('div'));

        // Assert
        expect(addEventListenerSpy1).toHaveBeenCalledWith('click', expect.any(Function));
        expect(addEventListenerSpy2).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('prevents default navigation for non-modifier clicks', () => {
        // Arrange
        const container = document.createElement('div');
        const link = document.createElement('a');
        link.setAttribute('data-seq', '5');
        container.appendChild(link);
        document.body.appendChild(container);

        const navContentDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        bindLinkClickHandlers(container, 'a[data-seq]', 'data-seq', 'journeys', 'owner', 'project', navContentDiv, contentDiv);

        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        // Act
        link.dispatchEvent(event);

        // Assert
        expect(preventDefaultSpy).toHaveBeenCalled();
        document.body.removeChild(container);
    });

    it('does nothing for ctrl+click (allows default navigation)', () => {
        // Arrange
        const container = document.createElement('div');
        const link = document.createElement('a');
        link.setAttribute('data-seq', '5');
        container.appendChild(link);
        document.body.appendChild(container);

        bindLinkClickHandlers(container, 'a[data-seq]', 'data-seq', 'journeys', 'owner', 'project', document.createElement('div'), document.createElement('div'));

        const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        // Act
        link.dispatchEvent(event);

        // Assert
        expect(preventDefaultSpy).not.toHaveBeenCalled();
        document.body.removeChild(container);
    });
});

describe('loadCommentsAndReactions', () => {
    let querySelectorSpy: any;

    beforeEach(() => {
        querySelectorSpy = vi.spyOn(document, 'querySelector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates reactions container when none exists in DOM', () => {
        // Arrange
        const detailDiv = document.createElement('div');
        vi.spyOn(detailDiv, 'append');

        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#testentity-comments') return null;
            if (sel === '#reactions-section') return null;
            return null;
        });

        // Act
        loadCommentsAndReactions(detailDiv, 'TestEntity', 1, 'owner', 'project', { permission: 'Edit' });

        // Assert
        expect(loadReactions).toHaveBeenCalled();
        const createdContainer = detailDiv.querySelector('#reactions-section');
        expect(createdContainer).not.toBeNull();
    });

    it('uses existing reactions container when present', () => {
        // Arrange
        const detailDiv = document.createElement('div');
        const existingReactions = document.createElement('div');
        existingReactions.id = 'reactions-section';
        document.body.appendChild(existingReactions);

        querySelectorSpy.mockImplementation((sel: string) => {
            if (sel === '#testentity-comments') return null;
            if (sel === '#reactions-section') return existingReactions;
            return null;
        });

        // Act
        loadCommentsAndReactions(detailDiv, 'TestEntity', 1, 'owner', 'project', { permission: 'Edit' });

        // Assert
        expect(loadReactions).toHaveBeenCalledWith(existingReactions, 'TestEntity', '1', 'owner', 'project', { permission: 'Edit' });
        document.body.removeChild(existingReactions);
    });
});
