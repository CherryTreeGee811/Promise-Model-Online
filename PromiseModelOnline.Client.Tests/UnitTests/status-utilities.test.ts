import { describe, it, expect } from 'vitest';
import { getStatusIcon, getStatusLabel, getStatusBucket, getStatusHtml } from '../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts';

describe('getStatusIcon', () => {
    it('returns green circle for green color', () => {
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns green circle for done status', () => {
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns red circle for red color', () => {
        expect(getStatusIcon('red')).toBe('🔴');
    });

    it('returns orange circle for orange color', () => {
        expect(getStatusIcon('orange')).toBe('🟠');
    });

    it('returns black circle for black color', () => {
        expect(getStatusIcon('black')).toBe('⚫️');
    });

    it('returns empty string for unknown value', () => {
        expect(getStatusIcon('unknown')).toBe('⚪');
    });
});

describe('getStatusLabel', () => {
    it('returns "Done" for green statusColor', () => {
        expect(getStatusLabel('green')).toBe('Done');
    });

    it('returns "Todo" for red statusColor', () => {
        expect(getStatusLabel('red')).toBe('Todo');
    });

    it('returns "In Progress" for orange statusColor', () => {
        expect(getStatusLabel('orange')).toBe('In Progress');
    });

    it('returns "Blocked" for black statusColor', () => {
        expect(getStatusLabel('black')).toBe('Blocked');
    });

    it('returns "Unknown" for unrecognized value', () => {
        expect(getStatusLabel('unknown')).toBe('Unknown');
    });
});

describe('getStatusBucket', () => {
    it('returns "done" for green statusColor', () => {
        expect(getStatusBucket('green')).toBe('done');
    });

    it('returns "todo" for red statusColor', () => {
        expect(getStatusBucket('red')).toBe('todo');
    });

    it('returns "blocked" for black statusColor', () => {
        expect(getStatusBucket('black')).toBe('blocked');
    });

    it('returns "inprogress" for orange statusColor', () => {
        expect(getStatusBucket('orange')).toBe('inprogress');
    });

    it('returns "other" for unknown color', () => {
        expect(getStatusBucket('purple')).toBe('other');
    });
});

describe('getStatusHtml', () => {
    it('returns span with green icon and Done label', () => {
        const html = getStatusHtml('green');
        expect(html).toContain('🟢');
        expect(html).toContain('Done');
    });

    it('returns span with red icon and Todo label', () => {
        const html = getStatusHtml('red');
        expect(html).toContain('🔴');
        expect(html).toContain('Todo');
    });
});
