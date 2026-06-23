import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>mock</div>'),
    });
    Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/test', assign: vi.fn() },
        writable: true,
    });
});

import { createStatusRow, createDateRow } from '../../PromiseModelOnline.Client/wwwroot/js/utils/detail-common.ts';

describe('createStatusRow', () => {
    it('returns a table row element', () => {
        const row = createStatusRow('green');
        expect(row.tagName).toBe('TR');
    });

    it('contains a scope="row" th with text "Status"', () => {
        const row = createStatusRow('green');
        const th = row.querySelector('th');
        expect(th).not.toBeNull();
        expect(th!.getAttribute('scope')).toBe('row');
        expect(th!.textContent).toBe('Status');
    });

    it('includes the status icon based on color', () => {
        const row = createStatusRow('green');
        const iconSpan = row.querySelector('span[aria-hidden="true"]');
        expect(iconSpan).not.toBeNull();
        expect(iconSpan!.textContent).toBe('🟢');
    });

    it('includes the status label based on color', () => {
        const row = createStatusRow('red');
        const srSpan = row.querySelector('.sr-only');
        expect(srSpan).not.toBeNull();
        expect(srSpan!.textContent.length).toBeGreaterThan(0);
    });

    it('handles undefined status color', () => {
        const row = createStatusRow(undefined);
        const srSpan = row.querySelector('.sr-only');
        expect(srSpan).not.toBeNull();
        expect(srSpan!.textContent.length).toBeGreaterThan(0);
    });
});

describe('createDateRow', () => {
    it('returns a table row element', () => {
        const row = createDateRow('Created');
        expect(row.tagName).toBe('TR');
    });

    it('contains a scope="row" th with the label text', () => {
        const row = createDateRow('Updated');
        const th = row.querySelector('th');
        expect(th).not.toBeNull();
        expect(th!.getAttribute('scope')).toBe('row');
        expect(th!.textContent).toBe('Updated');
    });

    it('formats a date string', () => {
        const row = createDateRow('Created', '2026-06-01');
        const td = row.querySelector('td');
        expect(td!.textContent).toMatch(/2026/);
    });

    it('uses en-dash for undefined date', () => {
        const row = createDateRow('Created', undefined);
        const td = row.querySelector('td');
        expect(td!.textContent).toBe('\u2013');
    });

    it('uses en-dash for empty date string', () => {
        const row = createDateRow('Created', '');
        const td = row.querySelector('td');
        expect(td!.textContent).toBe('\u2013');
    });
});
