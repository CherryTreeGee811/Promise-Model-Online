import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    buildGraphViewHref,
    getOwnerProjectFromPath,
    upsertGraphViewButton,
} from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-link.ts';

describe('buildGraphViewHref', () => {
    it('returns href with focus parameter', () => {
        // Act
        const href = buildGraphViewHref('owner1', 'proj1', 'promise-5');
        // Assert
        expect(href).toBe('/owner1/proj1/graph?focus=promise-5');
    });

    it('encodes special characters in focusNodeId', () => {
        // Act
        const href = buildGraphViewHref('owner1', 'proj1', 'node/1&2');
        // Assert
        expect(href).toBe('/owner1/proj1/graph?focus=node%2F1%262');
    });

    it('trims whitespace from inputs', () => {
        // Act
        const href = buildGraphViewHref('  owner1  ', '  proj1  ', '  node-1  ');
        // Assert
        expect(href).toBe('/owner1/proj1/graph?focus=node-1');
    });

    it('returns undefined when owner is empty string', () => {
        // Assert
        expect(buildGraphViewHref('', 'proj1', 'node-1')).toBeUndefined();
    });

    it('returns undefined when project is empty string', () => {
        // Assert
        expect(buildGraphViewHref('owner1', '', 'node-1')).toBeUndefined();
    });

    it('returns undefined when focusNodeId is empty string', () => {
        // Assert
        expect(buildGraphViewHref('owner1', 'proj1', '')).toBeUndefined();
    });

    it('returns undefined when owner is undefined', () => {
        // Assert
        expect(buildGraphViewHref(undefined as any, 'proj1', 'node-1')).toBeUndefined();
    });

    it('returns undefined when project is undefined', () => {
        // Assert
        expect(buildGraphViewHref('owner1', undefined as any, 'node-1')).toBeUndefined();
    });

    it('returns undefined when focusNodeId is undefined', () => {
        // Assert
        expect(buildGraphViewHref('owner1', 'proj1', undefined as any)).toBeUndefined();
    });

    it('returns undefined when owner is null', () => {
        // Assert
        expect(buildGraphViewHref(null as any, 'proj1', 'node-1')).toBeUndefined();
    });

    it('returns undefined when all parameters are missing', () => {
        // Assert
        expect(buildGraphViewHref(undefined as any, undefined as any, undefined as any)).toBeUndefined();
    });

    it('returns undefined when trimmed owner is empty (whitespace only)', () => {
        // Assert
        expect(buildGraphViewHref('   ', 'proj1', 'node-1')).toBeUndefined();
    });

    it('returns undefined when trimmed project is empty (whitespace only)', () => {
        // Assert
        expect(buildGraphViewHref('owner1', '   ', 'node-1')).toBeUndefined();
    });

    it('returns undefined when trimmed focusNodeId is empty (whitespace only)', () => {
        // Assert
        expect(buildGraphViewHref('owner1', 'proj1', '   ')).toBeUndefined();
    });
});

describe('getOwnerProjectFromPath', () => {
    beforeEach(() => {
        globalThis.location = { ...globalThis.location, pathname: '/' };
    });

    it('extracts owner and project from graph path', () => {
        // Arrange
        globalThis.location.pathname = '/ownerX/projectY/graph';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBe('ownerX');
        expect(result.project).toBe('projectY');
    });

    it('extracts from deep paths with extra segments', () => {
        // Arrange
        globalThis.location.pathname = '/alice/my-project/promises/5';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBe('alice');
        expect(result.project).toBe('my-project');
    });

    it('returns undefined for root path', () => {
        // Arrange
        globalThis.location.pathname = '/';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBeUndefined();
        expect(result.project).toBeUndefined();
    });

    it('returns undefined when path has only owner (single segment)', () => {
        // Arrange
        globalThis.location.pathname = '/owner-only/';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBeUndefined();
        expect(result.project).toBeUndefined();
    });

    it('returns undefined when path has no leading slash', () => {
        // Arrange
        globalThis.location.pathname = 'no-leading-slash';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBeUndefined();
        expect(result.project).toBeUndefined();
    });

    it('returns undefined when pathname is empty string', () => {
        // Arrange
        globalThis.location.pathname = '';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBeUndefined();
        expect(result.project).toBeUndefined();
    });

    it('handles path with trailing slash after owner/project', () => {
        // Arrange
        globalThis.location.pathname = '/bob/repo/';
        // Act
        const result = getOwnerProjectFromPath();
        // Assert
        expect(result.owner).toBe('bob');
        expect(result.project).toBe('repo');
    });
});

describe('upsertGraphViewButton', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    function createDetailDiv(): HTMLElement {
        const div = document.createElement('div');
        document.body.append(div);
        return div;
    }

    function createDetailDivWithBackLink(): HTMLElement {
        const div = document.createElement('div');
        const backLink = document.createElement('a');
        backLink.id = 'back-link';
        div.append(backLink);
        document.body.append(div);
        return div;
    }

    it('inserts a button into an empty detail container', () => {
        // Arrange
        const div = createDetailDiv();
        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');

        // Act
        const button = div.querySelector('#graph-view-link');
        // Assert
        expect(button).not.toBeNull();
        expect(button!.tagName).toBe('A');
        expect(button!.className).toContain('btn');
        expect(button!.className).toContain('btn-outline-secondary');
    });

    it('adds icon and text to the button', () => {
        // Arrange
        const div = createDetailDiv();
        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');

        const button = div.querySelector('#graph-view-link')!;
        // Act
        const icon = button.querySelector('i');
        // Assert
        expect(icon).not.toBeNull();
        expect(icon!.className).toContain('bi-diagram-3');

        const span = button.querySelector('span');
        expect(span).not.toBeNull();
        expect(span!.textContent).toBe(' Graph View');
    });

    it('inserts button before #back-link when back-link exists', () => {
        // Arrange
        const div = createDetailDivWithBackLink();
        const backLink = div.querySelector('#back-link')!;
        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');

        const button = div.querySelector('#graph-view-link')!;
        const children = Array.from(div.children);
        const buttonIndex = children.indexOf(button);
        // Act
        const backIndex = children.indexOf(backLink);
        // Assert
        expect(buttonIndex).toBeLessThan(backIndex);
    });

    it('does not create duplicate buttons on second call', () => {
        // Arrange
        const div = createDetailDiv();
        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');
        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');

        // Act
        const buttons = div.querySelectorAll('#graph-view-link');
        // Assert
        expect(buttons.length).toBe(1);
    });

    it('does nothing when detailContainer is null', () => {
        // Assert
        expect(() => upsertGraphViewButton(null as any, '/owner/proj/graph?focus=n1')).not.toThrow();
    });

    it('does nothing when href is empty string', () => {
        // Arrange
        const div = createDetailDiv();
        // Act
        upsertGraphViewButton(div, '');
        // Assert
        expect(div.querySelector('#graph-view-link')).toBeNull();
    });

    it('does nothing when both detailContainer is null and href is empty', () => {
        // Assert
        expect(() => upsertGraphViewButton(null as any, '')).not.toThrow();
    });

    it('appends button when back-link has no parentElement', () => {
        // Arrange
        const div = createDetailDiv();
        const orphanBack = document.createElement('a');
        orphanBack.id = 'back-link';
        Object.defineProperty(orphanBack, 'parentElement', { value: null, writable: false });
        vi.spyOn(div, 'querySelector').mockImplementation((sel) => {
            if (sel === '#back-link') return orphanBack;
            if (sel === '#graph-view-link') return null;
            return null;
        });

        upsertGraphViewButton(div, '/owner/proj/graph?focus=n1');
        // Act
        const lastChild = div.lastElementChild;
        // Assert
        expect(lastChild).not.toBeNull();
        expect(lastChild!.id).toBe('graph-view-link');
    });
});
