import { describe, it, expect } from 'vitest';
import { formatCommentText } from '../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts';

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
});
