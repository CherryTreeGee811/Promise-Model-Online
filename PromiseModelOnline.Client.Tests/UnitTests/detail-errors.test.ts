import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn().mockRejectedValue(new Error('Template fail')), loadTemplateWithError: () => vi.fn(), navigate: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = ''
        + '<div id="content"></div><div id="main-menu"></div>'
        + '<div id="error-text"></div><div id="promise-detail-loading"></div><div id="promise-detail-content"></div>'
        + '<div id="detail-stack-graph"></div>'
        + '<div id="epic-detail-content"><div id="epic-detail-loading"></div></div>'
        + '<div id="journey-detail-content"><div id="journey-detail-loading"></div></div>'
        + '<div id="flow-detail-content"><div id="flow-detail-loading"></div></div>'
        + '<div id="moment-detail-content"><div id="moment-detail-loading"></div></div>'
        + '<div id="error-title"></div><div id="error-message"></div>';
});

describe('loadPromiseDetail error handling', () => {
    it('handles fetch failures gracefully', async () => {
        // Arrange
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        // Act
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Assert
        await expect(loadPromiseDetail('o', 'p', '1', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

describe('loadEpicDetail error handling', () => {
    it('handles fetch failures gracefully', async () => {
        // Arrange
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        // Act
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Assert
        await expect(loadEpicDetail('o', 'p', '1', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

describe('loadJourneyDetail error handling', () => {
    it('handles fetch failures gracefully', async () => {
        // Arrange
        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        // Act
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Assert
        await expect(loadJourneyDetail('o', 'p', '1', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

describe('loadFlowDetail error handling', () => {
    it('handles fetch failures gracefully', async () => {
        // Arrange
        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        // Act
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Assert
        await expect(loadFlowDetail('o', 'p', '1', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

describe('loadMomentDetail error handling', () => {
    it('handles fetch failures gracefully', async () => {
        // Arrange
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        // Act
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Assert
        await expect(loadMomentDetail('o', 'p', '100', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});
