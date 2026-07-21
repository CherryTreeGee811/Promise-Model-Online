import { describe, it, expect } from 'vitest';
import { getStrideStartDateValue } from '../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts';

describe('getStrideStartDateValue', () => {
    it('converts date string to timestamp', () => {
        // Act
        const result = getStrideStartDateValue({ startDate: '2026-06-01T00:00:00Z' });
        // Assert
        expect(result).toBeGreaterThan(0);
    });

    it('returns 0 for invalid date', () => {
        // Act
        const result = getStrideStartDateValue({ startDate: 'not-a-date' });
        // Assert
        expect(result).toBe(0);
    });

    it('returns 0 for missing startDate', () => {
        // Act
        const result = getStrideStartDateValue({});
        // Assert
        expect(result).toBe(0);
    });
});
