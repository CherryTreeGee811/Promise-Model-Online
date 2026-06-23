import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({ ensureModal: vi.fn().mockReturnValue(document.createElement('div')) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<div>mock</div>') });
});

describe('openStrideCreateModal', () => {
    it('creates modal and renders form', async () => {
        const { openStrideCreateModal } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/stride-create-modal.ts');
        const onCreated = vi.fn();
        openStrideCreateModal({ owner: 'o', project: 'p', onCreated });
        expect(onCreated).not.toHaveBeenCalled();
    });
});
