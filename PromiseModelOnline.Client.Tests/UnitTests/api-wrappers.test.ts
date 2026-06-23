import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = { apiGet: vi.fn(), apiGetList: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() };
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => mockApi);

beforeEach(() => { vi.clearAllMocks(); });

async function importTest(name: string) {
    return import(`../../PromiseModelOnline.Client/wwwroot/js/${name}/api.ts`);
}

describe('promises/api', () => {
    it('getPromise calls apiGet with correct URL', async () => {
        const mod = await importTest('promises');
        mod.getPromise('owner1', 'proj1', '5');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/owner1/proj1/promises/5');
    });
    it('getEpicsByPromise calls apiGet with promiseSeq query', async () => {
        const mod = await importTest('promises');
        mod.getEpicsByPromise('o', 'p', '3');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/epics?promiseSeq=3');
    });
    it('createPromise calls apiPost with data', async () => {
        const mod = await importTest('promises');
        mod.createPromise('o', 'p', { statement: 'test' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/promises/create', { statement: 'test' });
    });
    it('updatePromiseDescription calls apiPatch', async () => {
        const mod = await importTest('promises');
        mod.updatePromiseDescription('o', 'p', '1', 'new desc');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/promises/1/description', { description: 'new desc' });
    });
});

describe('epics/api', () => {
    it('getEpic builds URL with sequenceNumber', async () => {
        const mod = await importTest('epics');
        mod.getEpic('o', 'p', '7');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/epics/7');
    });
    it('getJourneys builds URL with epicSeq', async () => {
        const mod = await importTest('epics');
        mod.getJourneys('o', 'p', '2');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/journeys?epicSeq=2');
    });
    it('createEpic calls apiPost', async () => {
        const mod = await importTest('epics');
        mod.createEpic('o', 'p', { statement: 'E1' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/epics/create', { statement: 'E1' });
    });
});

describe('flows/api', () => {
    it('getFlow builds URL', async () => {
        const mod = await importTest('flows');
        mod.getFlow('o', 'p', '4');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/flows/4');
    });
    it('getMoments builds URL with flowSeq', async () => {
        const mod = await importTest('flows');
        mod.getMoments('o', 'p', '4');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments?flowSeq=4');
    });
});

describe('journeys/api', () => {
    it('getJourney builds URL', async () => {
        const mod = await importTest('journeys');
        mod.getJourney('o', 'p', '2');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/journeys/2');
    });
    it('getFlows builds URL with journeySeq', async () => {
        const mod = await importTest('journeys');
        mod.getFlows('o', 'p', '2');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/flows?journeySeq=2');
    });
});

describe('moments/api', () => {
    it('getMoment builds URL', async () => {
        const mod = await importTest('moments');
        mod.getMoment('o', 'p', '100');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments/100');
    });
    it('updateMomentStatus calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentStatus('o', 'p', '100', 'Done');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/100/status', { newStatus: 'Done' });
    });
    it('createTask calls apiPost', async () => {
        const mod = await importTest('moments');
        mod.createTask('o', 'p', '100', { name: 'task1' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/100/tasks', { name: 'task1' });
    });
});

describe('strides/api', () => {
    it('getStrides calls apiGetList', async () => {
        const mod = await importTest('strides');
        mod.getStrides('o', 'p');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/strides');
    });
    it('progressStride calls apiPost', async () => {
        const mod = await importTest('strides');
        mod.progressStride('o', 'p', '10');
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/strides/10/progress', {});
    });
});

describe('iterations/api', () => {
    it('getIterations calls apiGetList', async () => {
        const mod = await importTest('iterations');
        mod.getIterations('o', 'p');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/iterations');
    });
    it('getBurndown calls apiGet', async () => {
        const mod = await importTest('iterations');
        mod.getBurndown('o', 'p', '1');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/iterations/1/burndown');
    });
});

describe('comments/api', () => {
    it('getComments calls apiGet', async () => {
        const mod = await importTest('comments');
        mod.getComments('Moment', 100, 'o', 'p');
        expect(mockApi.apiGet).toHaveBeenCalled();
    });
});

describe('reactions/api', () => {
    it('addReaction calls apiPost', async () => {
        const mod = await importTest('reactions');
        mod.addReaction('o', 'p', { emoji: '👍' });
        expect(mockApi.apiPost).toHaveBeenCalled();
    });
});

describe('notifications/api', () => {
    it('fetchAllNotifications calls apiGet', async () => {
        const mod = await importTest('notifications');
        mod.fetchAllNotifications();
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/notifications');
    });
});

describe('invitations/api', () => {
    it('getPendingInvitations calls apiGet', async () => {
        const mod = await importTest('invitations');
        mod.getPendingInvitations();
        expect(mockApi.apiGet).toHaveBeenCalled();
    });
});

describe('projects/api', () => {
    it('getGraphData calls authFetch', async () => {
        const mod = await importTest('projects');
        try { await mod.getGraphData('o', 'p'); } catch {}
        expect(mockApi.authFetch).toHaveBeenCalledWith('/api/projects/o/p/graph');
    });
    it('createProject calls authFetch POST', async () => {
        const mod = await importTest('projects');
        try { await mod.createProject({ name: 'P1' }); } catch {}
        expect(mockApi.authFetch).toHaveBeenCalledWith('/api/projects/create', expect.objectContaining({
            method: 'POST', body: JSON.stringify({ name: 'P1' }),
        }));
    });
});
