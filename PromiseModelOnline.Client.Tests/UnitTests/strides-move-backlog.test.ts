import { describe, it, expect } from 'vitest';

describe('handleMoveToBacklog', () => {
    it('exports handleMoveToBacklog function', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.handleMoveToBacklog).toBeDefined();
    });
});
