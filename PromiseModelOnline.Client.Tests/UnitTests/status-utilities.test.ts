import { describe, it, expect } from 'vitest';
import { getStatusIcon, getStatusLabel, getStatusBucket, getStatusHtml } from '../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts';

describe('getStatusIcon', () => {
    it('returns green circle for green color', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns green circle for done status', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('green')).toBe('🟢');
    });

    it('returns red circle for red color', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('red')).toBe('🔴');
    });

    it('returns orange circle for orange color', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('orange')).toBe('🟠');
    });

    it('returns black circle for black color', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('black')).toBe('⚫️');
    });

    it('returns empty string for unknown value', () => {
        // Arrange
        // Assert
        expect(getStatusIcon('unknown')).toBe('⚪');
    });
});

describe('getStatusLabel', () => {
    it('returns "Done" for green statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusLabel('green')).toBe('Done');
    });

    it('returns "Todo" for red statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusLabel('red')).toBe('Todo');
    });

    it('returns "In Progress" for orange statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusLabel('orange')).toBe('In Progress');
    });

    it('returns "Blocked" for black statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusLabel('black')).toBe('Blocked');
    });

    it('returns "Unknown" for unrecognized value', () => {
        // Arrange
        // Assert
        expect(getStatusLabel('unknown')).toBe('Unknown');
    });
});

describe('getStatusBucket', () => {
    it('returns "done" for green statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusBucket('green')).toBe('done');
    });

    it('returns "todo" for red statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusBucket('red')).toBe('todo');
    });

    it('returns "blocked" for black statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusBucket('black')).toBe('blocked');
    });

    it('returns "inprogress" for orange statusColor', () => {
        // Arrange
        // Assert
        expect(getStatusBucket('orange')).toBe('inprogress');
    });

    it('returns "other" for unknown color', () => {
        // Arrange
        // Assert
        expect(getStatusBucket('purple')).toBe('other');
    });
});

describe('getStatusHtml', () => {
    it('returns span with green icon and Done label', () => {
        // Arrange
        // Act
        const html = getStatusHtml('green');
        // Assert
        expect(html).toContain('🟢');
        expect(html).toContain('Done');
    });

    it('returns span with red icon and Todo label', () => {
        // Arrange
        // Act
        const html = getStatusHtml('red');
        // Assert
        expect(html).toContain('🔴');
        expect(html).toContain('Todo');
    });
});
