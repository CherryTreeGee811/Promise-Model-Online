import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
    document.body.innerHTML = ''
        + '<select class="status-dropdown"></select>'
        + '<select class="estimate-dropdown"></select>'
        + '<select class="owner-dropdown"></select>'
        + '<select class="moment-type-dropdown"></select>'
        + '<select class="backlog-target-stride"></select>'
        + '<button class="move-to-backlog-btn"></button>'
        + '<button class="move-to-stride-from-backlog-btn"></button>'
        + '<button class="progress-stride-btn"></button>';
});

describe('applyPermissionUI', () => {
    it('disables controls when canEdit is false', async () => {
        // Arrange
        const { applyPermissionUI } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        applyPermissionUI(false);
        // Act
        document.querySelectorAll('select, button').forEach(el => {
            if (el.matches('.progress-stride-btn')) {
                // Assert
                expect(el.classList.contains('hidden')).toBe(true);
            } else {
                expect((el as HTMLInputElement).disabled).toBe(true);
            }
        });
    });

    it('enables controls when canEdit is true', async () => {
        // Arrange
        const { applyPermissionUI } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        applyPermissionUI(true);
        // Act
        document.querySelectorAll('select, button:not(.progress-stride-btn)').forEach(el => {
            // Assert
            expect((el as HTMLInputElement).disabled).toBe(false);
        });
    });
});
