import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts';
import { isAtLeast } from '../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts';
import { formatCommentText } from '../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts';

describe('escapeHtml', () => {
    it('converts null to string', () => {
        expect(escapeHtml(null)).toBe('null');
    });

    it('converts undefined to string', () => {
        expect(escapeHtml(undefined)).toBe('undefined');
    });

    it('passes through plain text unchanged', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('escapes ampersands', () => {
        expect(escapeHtml('AT&T')).toBe('AT&amp;T');
    });

    it('escapes less-than', () => {
        expect(escapeHtml('x < 10')).toBe('x &lt; 10');
    });

    it('escapes greater-than', () => {
        expect(escapeHtml('10 > x')).toBe('10 &gt; x');
    });

    it('escapes double quotes', () => {
        expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('escapes single quotes', () => {
        expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
    });

    it('converts numbers to string', () => {
        expect(escapeHtml(42)).toBe('42');
    });

    it('combines multiple escapes', () => {
        expect(escapeHtml('<script>alert("x&y")</script>')).toBe('&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;');
    });
});

describe('isAtLeast', () => {
    it('returns true for exact match', () => {
        expect(isAtLeast('Edit', 'Edit')).toBe(true);
    });

    it('returns true for higher permission', () => {
        expect(isAtLeast('Owner', 'Edit')).toBe(true);
    });

    it('returns false for lower permission', () => {
        expect(isAtLeast('Comment', 'Edit')).toBe(false);
    });

    it('returns true for Owner compared to any', () => {
        expect(isAtLeast('Owner', 'View')).toBe(true);
        expect(isAtLeast('Owner', 'Comment')).toBe(true);
        expect(isAtLeast('Owner', 'Edit')).toBe(true);
    });

    it('returns false for View compared to Edit', () => {
        expect(isAtLeast('View', 'Edit')).toBe(false);
    });
});

describe('formatCommentText', () => {
    it('converts null to string', () => {
        expect(formatCommentText(null as unknown as string)).toBe('null');
    });

    it('converts undefined to string', () => {
        expect(formatCommentText(undefined as unknown as string)).toBe('undefined');
    });

    it('passes through plain text', () => {
        expect(formatCommentText('Hello')).toBe('Hello');
    });

    it('wraps #entity-ref references in legacy anchor tags', () => {
        const result = formatCommentText('See #promise-123 for details');
        expect(result).toContain('<a href="/promises/123"');
        expect(result).toContain('class="promise-ref promise-ref--legacy"');
        expect(result).toContain('>#promise-123</a>');
    });

    it('wraps @mentions in mention span', () => {
        const result = formatCommentText('Assigned to @user1');
        expect(result).toContain('<span class="mention">');
        expect(result).toContain('>@user1</span>');
    });

    it('escapes HTML in text', () => {
        const result = formatCommentText('<script>alert("x")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });
});
