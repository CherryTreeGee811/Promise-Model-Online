import { describe, it, expect, beforeEach } from 'vitest';
import { buildGraphViewHref, getOwnerProjectFromPath } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-link.ts';

describe('buildGraphViewHref', () => {
    it('returns href with focus parameter', () => {
        const href = buildGraphViewHref('owner1', 'proj1', 'promise-5');
        expect(href).toContain('/owner1/proj1/graph');
        expect(href).toContain('focus=promise-5');
    });
});

describe('getOwnerProjectFromPath', () => {
    beforeEach(() => {
        globalThis.location = { ...globalThis.location, pathname: '/' };
    });

    it('extracts owner and project from path', () => {
        globalThis.location.pathname = '/ownerX/projectY/graph';
        const result = getOwnerProjectFromPath();
        expect(result.owner).toBe('ownerX');
        expect(result.project).toBe('projectY');
    });

    it('extracts from deep paths', () => {
        globalThis.location.pathname = '/alice/my-project/promises/5';
        const result = getOwnerProjectFromPath();
        expect(result.owner).toBe('alice');
        expect(result.project).toBe('my-project');
    });

    it('returns default for root path', () => {
        globalThis.location.pathname = '/';
        const result = getOwnerProjectFromPath();
        expect(result.owner).toBeUndefined();
    });
});
