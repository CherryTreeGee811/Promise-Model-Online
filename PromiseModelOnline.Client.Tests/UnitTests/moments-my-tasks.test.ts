import { describe, it, expect } from 'vitest';

describe('loadMyTasksPage', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        expect(mod.loadMyTasksPage).toBeDefined();
    });
});
