import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAtLeast, fetchMyPermission } from '../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getMyPermission: vi.fn(),
}));

import { getMyPermission } from '../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts';

const mockGetMyPermission = vi.mocked(getMyPermission);

describe('isAtLeast', () => {
    it('View is at least View', () => {
        // Arrange
        // Assert
        expect(isAtLeast('View', 'View')).toBe(true);
    });

    it('View is not at least Comment', () => {
        // Arrange
        // Assert
        expect(isAtLeast('View', 'Comment')).toBe(false);
    });

    it('Comment is at least View', () => {
        // Arrange
        // Assert
        expect(isAtLeast('Comment', 'View')).toBe(true);
    });

    it('Edit is at least Comment', () => {
        // Arrange
        // Assert
        expect(isAtLeast('Edit', 'Comment')).toBe(true);
    });

    it('Owner is at least Owner', () => {
        // Arrange
        // Assert
        expect(isAtLeast('Owner', 'Owner')).toBe(true);
    });

    it('Owner is at least View', () => {
        // Arrange
        // Assert
        expect(isAtLeast('Owner', 'View')).toBe(true);
    });

    it('non-existent permission level defaults to 0, fails for Edit minimum', () => {
        // Arrange
        // Assert
        expect(isAtLeast('SuperAdmin', 'Edit')).toBe(false);
    });

    it('unknown minimum defaults to 0, so View reaches it', () => {
        // Arrange
        // Assert
        expect(isAtLeast('View', 'UnknownMinimum')).toBe(true);
    });

    it('unknown minimum defaults to 0, so Comment also reaches it', () => {
        // Arrange
        // Assert
        expect(isAtLeast('Comment', 'UnknownMinimum')).toBe(true);
    });

    it('both unknown levels default to 0, returns true', () => {
        // Arrange
        // Assert
        expect(isAtLeast('UnknownA', 'UnknownB')).toBe(true);
    });

    it('case-sensitive matching fails for lowercase', () => {
        // Arrange
        // Assert
        expect(isAtLeast('edit', 'Edit')).toBe(false);
    });


});

describe('fetchMyPermission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns permission and isOwner=true when API returns string "Owner"', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue('Owner' as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: 'Owner', isOwner: true });
    });

    it('returns permission and isOwner=false when API returns non-Owner string', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue('Edit' as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: 'Edit', isOwner: false });
    });

    it('returns permission and isOwner=true when API returns object with isOwner true', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue({ permission: 'View', isOwner: true } as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: 'View', isOwner: true });
    });

    it('returns permission and isOwner=false when API returns object with isOwner false', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue({ permission: 'Comment', isOwner: false } as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: 'Comment', isOwner: false });
    });

    it('returns undefined permission and isOwner=false when API returns object without permission', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue({ isOwner: false } as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: undefined, isOwner: false });
    });

    it('returns undefined permission and isOwner=false when API returns empty object', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue({} as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: undefined, isOwner: false });
    });

    it('returns undefined permission and isOwner=false when API returns null', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue(null as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: undefined, isOwner: false });
    });

    it('returns undefined permission and isOwner=false when API returns undefined', async () => {
        // Arrange
        mockGetMyPermission.mockResolvedValue(undefined as never);
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: undefined, isOwner: false });
    });

    it('returns undefined permission and isOwner=false when getMyPermission throws', async () => {
        // Arrange
        mockGetMyPermission.mockRejectedValue(new Error('Network error'));
        // Act
        const result = await fetchMyPermission('owner', 'project');
        // Assert
        expect(result).toEqual({ permission: undefined, isOwner: false });
    });
});
