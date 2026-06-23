import { describe, it, expect } from 'vitest';

describe('handleMoveToBacklog', () => {
    it('exports handleMoveToBacklog function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        expect(mod.handleMoveToBacklog).toBeDefined();
    });
});
