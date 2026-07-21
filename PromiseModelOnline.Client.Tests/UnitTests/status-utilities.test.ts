import { describe, it, expect } from 'vitest';
import { getStatusIcon, getStatusLabel, getStatusBucket, getStatusHtml } from '../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts';

describe('getStatusIcon', () => {
    it('returns green circle for green color', () => {
        // Assert
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns green circle for done status', () => {
        // Assert
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns red circle for red color', () => {
        // Assert
        expect(getStatusIcon('red')).toBe('🔴');
    });

    it('returns orange circle for orange color', () => {
        // Assert
        expect(getStatusIcon('orange')).toBe('🟠');
    });

    it('returns black circle for black color', () => {
        // Assert
        expect(getStatusIcon('black')).toBe('⚫️');
    });

    it('returns empty string for unknown value', () => {
        // Assert
        expect(getStatusIcon('unknown')).toBe('⚪');
    });
});

describe('getStatusLabel', () => {
    it('returns "Done" for green statusColor', () => {
        // Assert
        expect(getStatusLabel('green')).toBe('Done');
    });

    it('returns "Todo" for red statusColor', () => {
        // Assert
        expect(getStatusLabel('red')).toBe('Todo');
    });

    it('returns "In Progress" for orange statusColor', () => {
        // Assert
        expect(getStatusLabel('orange')).toBe('In Progress');
    });

    it('returns "Blocked" for black statusColor', () => {
        // Assert
        expect(getStatusLabel('black')).toBe('Blocked');
    });

    it('returns "Unknown" for unrecognized value', () => {
        // Assert
        expect(getStatusLabel('unknown')).toBe('Unknown');
    });
});

describe('getStatusBucket', () => {
    it('returns "done" for green statusColor', () => {
        // Assert
        expect(getStatusBucket('green')).toBe('done');
    });

    it('returns "todo" for red statusColor', () => {
        // Assert
        expect(getStatusBucket('red')).toBe('todo');
    });

    it('returns "blocked" for black statusColor', () => {
        // Assert
        expect(getStatusBucket('black')).toBe('blocked');
    });

    it('returns "inprogress" for orange statusColor', () => {
        // Assert
        expect(getStatusBucket('orange')).toBe('inprogress');
    });

    it('returns "other" for unknown color', () => {
        // Assert
        expect(getStatusBucket('purple')).toBe('other');
    });
});

describe('getStatusHtml', () => {
    it('returns span with green icon and Done label', () => {
        // Act
        const html = getStatusHtml('green');
        // Assert
        expect(html).toContain('🟢');
        expect(html).toContain('Done');
    });

    it('returns span with red icon and Todo label', () => {
        // Act
        const html = getStatusHtml('red');
        // Assert
        expect(html).toContain('🔴');
        expect(html).toContain('Todo');
    });
});
