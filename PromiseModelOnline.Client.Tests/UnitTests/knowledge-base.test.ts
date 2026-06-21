import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
    document.body.innerHTML = '<div id="kb-content"></div><link id="kb-nav-links">';
});

describe('loadKnowledgeBase', () => {
    it('populates the knowledge base container', async () => {
        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        const container = document.getElementById('kb-content')!;
        loadKnowledgeBase();
        expect(container.children.length).toBeGreaterThan(0);
    });
});
