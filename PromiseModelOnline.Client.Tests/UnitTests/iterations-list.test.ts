import { describe, it, expect } from 'vitest';

describe('loadIterationHistory', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/iterations/list.ts');
        expect(mod.loadIterationHistory).toBeDefined();
    });
});
