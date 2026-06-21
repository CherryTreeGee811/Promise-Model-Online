import { describe, it, expect } from 'vitest';
import { loadGraphPage, hasNodeChildren, createDefaultFilters } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts';

describe('loadGraphPage', () => {
    it('exports loadGraphPage', () => {
        expect(loadGraphPage).toBeDefined();
    });
});

describe('hasNodeChildren (pure)', () => {
    it('detects nodes with children', () => {
        expect(hasNodeChildren({ children: [{ id: 'c' }] })).toBe(true);
    });
});

describe('createDefaultFilters (pure)', () => {
    it('returns filter defaults', () => {
        const f = createDefaultFilters();
        expect(f.search).toBe('');
    });
});
