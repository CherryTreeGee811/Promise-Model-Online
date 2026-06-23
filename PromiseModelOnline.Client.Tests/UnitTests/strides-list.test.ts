import { describe, it, expect } from 'vitest';

describe('loadStridesList', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        expect(mod.loadStridesList).toBeDefined();
    });
});
