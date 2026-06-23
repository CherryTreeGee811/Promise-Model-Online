import { describe, it, expect } from 'vitest';
import { getStrideStartDateValue } from '../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts';

describe('getStrideStartDateValue', () => {
    it('converts date string to timestamp', () => {
        const result = getStrideStartDateValue({ startDate: '2026-06-01T00:00:00Z' });
        expect(result).toBeGreaterThan(0);
    });

    it('returns 0 for invalid date', () => {
        const result = getStrideStartDateValue({ startDate: 'not-a-date' });
        expect(result).toBe(0);
    });

    it('returns 0 for missing startDate', () => {
        const result = getStrideStartDateValue({});
        expect(result).toBe(0);
    });
});
