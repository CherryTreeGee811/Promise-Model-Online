import { describe, it, expect } from 'vitest';
import { isAtLeast } from '../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts';

describe('isAtLeast', () => {
    it('View is at least View', () => {
        expect(isAtLeast('View', 'View')).toBe(true);
    });

    it('View is not at least Comment', () => {
        expect(isAtLeast('View', 'Comment')).toBe(false);
    });

    it('Comment is at least View', () => {
        expect(isAtLeast('Comment', 'View')).toBe(true);
    });

    it('Edit is at least Comment', () => {
        expect(isAtLeast('Edit', 'Comment')).toBe(true);
    });

    it('Owner is at least Owner', () => {
        expect(isAtLeast('Owner', 'Owner')).toBe(true);
    });

    it('Owner is at least View', () => {
        expect(isAtLeast('Owner', 'View')).toBe(true);
    });

    it('non-existent level returns false for Edit minimum', () => {
        expect(isAtLeast('SuperAdmin', 'Edit')).toBe(false);
    });

    it('case-sensitive matching (lowercase fails)', () => {
        expect(isAtLeast('edit', 'Edit')).toBe(false);
    });
});
