import { describe, it, expect } from 'vitest';

describe('loadProjectAuditHistoryPage', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/history.ts');
        expect(mod.loadProjectAuditHistoryPage).toBeDefined();
    });
});

describe('renderAuditTable', () => {
    it('exports expected function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts');
        expect(mod.renderAuditTable ?? mod.loadProjectAudit).toBeDefined();
    });
});
