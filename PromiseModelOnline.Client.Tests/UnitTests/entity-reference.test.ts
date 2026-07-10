import { describe, it, expect, afterEach, vi } from 'vitest';
import { formatCommentText, loadEntityLookupMap } from '../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts';

describe('formatCommentText', () => {
    it('returns plain text unchanged', () => {
        expect(formatCommentText('hello world')).toBe('hello world');
    });

    it('wraps @mentions in mention spans', () => {
        const result = formatCommentText('Hey @john, check this');
        expect(result).toContain('<span class="mention">');
        expect(result).toContain('@john');
    });

    it('escapes HTML in regular text', () => {
        const result = formatCommentText('<script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    it('handles empty string', () => {
        expect(formatCommentText('')).toBe('');
    });

    it('handles null/undefined by converting to string', () => {
        const result = formatCommentText(null as unknown as string);
        expect(result).toBeTruthy();
    });

    it('handles mixed mentions and text', () => {
        const result = formatCommentText('@alice check this');
        expect(result).toContain('@alice');
    });

    it('links #promise-123 without entity map entry', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });
        await loadEntityLookupMap('promise', 0, 'owner', 'project');
        const result = formatCommentText('#promise-123');
        expect(result).toContain('/owner/project/promises/123');
        expect(result).toContain('promise-ref--legacy');
    });

    it('escapes HTML in entity reference numbers', () => {
        const result = formatCommentText('<b>#promise-123</b>');
        expect(result).toContain('&lt;b&gt;');
    });
});

describe('loadEntityLookupMap', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('successfully loads entity map', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ entityType: 'promise', sequenceNumber: 123, id: 456, statusColor: 'green' }]),
        });
        await loadEntityLookupMap('promise', 123, 'owner', 'project');
        const result = formatCommentText('#promise-123');
        expect(result).toContain('promise-ref');
        expect(result).toContain('\u{1F7E2}');
    });

    it('handles fetch error silently', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
        await expect(loadEntityLookupMap('promise', 123, 'owner', 'project')).resolves.toBeUndefined();
    });
});
