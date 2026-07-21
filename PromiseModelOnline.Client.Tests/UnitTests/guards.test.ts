import { describe, it, expect, vi } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({
    isLoggedIn: vi.fn(),
}));

import { isLoggedIn } from '../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts';
import { requireAuth } from '../../PromiseModelOnline.Client/wwwroot/js/guards.ts';

describe('requireAuth', () => {
    it('returns allowed when logged in', () => {
        // Arrange
        vi.mocked(isLoggedIn).mockReturnValue(true);
        // Act
        const result = requireAuth();
        // Assert
        expect(result).toEqual({ allowed: true });
    });

    it('returns blocked with redirect when not logged in', () => {
        // Arrange
        vi.mocked(isLoggedIn).mockReturnValue(false);
        // Act
        const result = requireAuth();
        // Assert
        expect(result).toEqual({ allowed: false, redirect: '/login' });
    });
});
