import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn(), loadTemplateWithError: () => vi.fn(), navigate: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn().mockResolvedValue({}), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = ''
        + '<div id="content"></div><div id="main-menu"></div>'
        + '<div id="error-text"></div>'
        + '<div id="promise-detail-loading"></div><div id="promise-detail-content"></div>'
        + '<div id="detail-stack-graph"></div>'
        + '<div id="flow-detail-content"><div id="flow-detail-loading"></div></div>'
        + '<div id="journey-detail-content"><div id="journey-detail-loading"></div></div>'
        + '<div id="epic-detail-content"><div id="epic-detail-loading"></div></div>'
        + '<div id="moment-detail-content"><div id="moment-detail-loading"></div></div>'
        + '<div id="flow-journey-cell"></div><div id="epic-promise-cell"></div>'
        + '<div id="journey-epic-cell"></div><div id="moment-flow-cell"></div>'
        + '<div id="promise-epics-list"></div><div id="epic-journeys-list"></div>'
        + '<div id="journey-flows-list"></div><div id="flow-moments-list"></div>'
        + '<div id="moment-tasks-list"></div><div id="moment-task-list"></div>'
        + '<div id="promise-comments"></div><div id="epic-comments"></div>'
        + '<div id="journey-comments"></div><div id="flow-comments"></div>'
        + '<div id="moment-comments"></div><div id="reactions-section"></div>';
});

describe('loadPromiseDetail', () => {
    it('is defined and callable', async () => {
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        expect(loadPromiseDetail).toBeDefined();
    });
});

describe('loadEpicDetail', () => {
    it('is defined', async () => {
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        expect(loadEpicDetail).toBeDefined();
    });
});

describe('loadJourneyDetail', () => {
    it('is defined', async () => {
        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        expect(loadJourneyDetail).toBeDefined();
    });
});

describe('loadFlowDetail', () => {
    it('is defined', async () => {
        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        expect(loadFlowDetail).toBeDefined();
    });
});

describe('loadMomentDetail', () => {
    it('is defined', async () => {
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        expect(loadMomentDetail).toBeDefined();
    });
});
