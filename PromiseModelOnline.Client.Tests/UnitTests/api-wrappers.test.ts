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
    it('getMoment with flowId appends flowId param', async () => {
        const mod = await importTest('moments');
        mod.getMoment('o', 'p', '100', 42);
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments/100?flowId=42');
    });
    it('createMoment calls apiPost', async () => {
        const mod = await importTest('moments');
        mod.createMoment('o', 'p', { text: 'test' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/create', { text: 'test' });
    });
    it('getMyAssignedMoments calls apiGet', async () => {
        const mod = await importTest('moments');
        mod.getMyAssignedMoments();
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/moments/assigned-to-me');
    });
    it('updateMomentStatus calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentStatus('o', 'p', '100', 'Done');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/100/status', { newStatus: 'Done' });
    });
    it('updateMomentStatus with flowId includes flowId', async () => {
        const mod = await importTest('moments');
        mod.updateMomentStatus('o', 'p', '100', 'Done', 7);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/100/status?flowId=7', { newStatus: 'Done' });
    });
    it('assignMomentToStride calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.assignMomentToStride('o', 'p', '1', '10');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/stride-assignment', { strideId: '10' });
    });
    it('assignMomentToStride with flowId includes flowId', async () => {
        const mod = await importTest('moments');
        mod.assignMomentToStride('o', 'p', '1', '10', 42);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/stride-assignment?flowId=42', { strideId: '10' });
    });
    it('updateMomentEstimate calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentEstimate('o', 'p', '1', '5d');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/estimate', { estimate: '5d' });
    });
    it('updateMomentEstimate with undefined estimate', async () => {
        const mod = await importTest('moments');
        mod.updateMomentEstimate('o', 'p', '1', undefined);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/estimate', { estimate: undefined });
    });
    it('updateMomentType calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentType('o', 'p', '1', 'Bug');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/type', { newType: 'Bug' });
    });
    it('updateMomentOwner calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentOwner('o', 'p', '1', 'user1');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/owner', { userId: 'user1' });
    });
    it('updateMomentDescription calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateMomentDescription('o', 'p', '1', 'new desc');
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/description', { description: 'new desc' });
    });
    it('createTask calls apiPost', async () => {
        const mod = await importTest('moments');
        mod.createTask('o', 'p', '100', { name: 'task1' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/100/tasks', { name: 'task1' });
    });
    it('createTask with flowId includes flowId', async () => {
        const mod = await importTest('moments');
        mod.createTask('o', 'p', '100', { name: 'task1' }, 99);
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/100/tasks?flowId=99', { name: 'task1' });
    });
    it('updateTaskCompletion calls apiPatch', async () => {
        const mod = await importTest('moments');
        mod.updateTaskCompletion('o', 'p', '1', 'task1', true);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/tasks/task1/completion', { isCompleted: true });
    });
    it('updateTaskCompletion with flowId includes flowId', async () => {
        const mod = await importTest('moments');
        mod.updateTaskCompletion('o', 'p', '1', 'task1', true, 55);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/tasks/task1/completion?flowId=55', { isCompleted: true });
    });
});

describe('strides/api', () => {
    it('getStrides calls apiGetList', async () => {
        const mod = await importTest('strides');
        mod.getStrides('o', 'p');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/strides');
    });
    it('getStridesByIteration calls apiGetList with iterationId', async () => {
        const mod = await importTest('strides');
        mod.getStridesByIteration('o', 'p', '3');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/strides?iterationId=3');
    });
    it('getMomentsByStride calls apiGetList with strideId', async () => {
        const mod = await importTest('strides');
        mod.getMomentsByStride('o', 'p', '5');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?strideId=5');
    });
    it('getMomentsByIteration calls apiGetList without unassigned', async () => {
        const mod = await importTest('strides');
        mod.getMomentsByIteration('o', 'p', '2');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?iterationId=2');
    });
    it('getMomentsByIteration with isUnassigned adds unassigned=true', async () => {
        const mod = await importTest('strides');
        mod.getMomentsByIteration('o', 'p', '2', true);
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?iterationId=2&unassigned=true');
    });
    it('getIterations calls apiGetList', async () => {
        const mod = await importTest('strides');
        mod.getIterations('o', 'p');
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/iterations');
    });
    it('createStride calls apiPost with data', async () => {
        const mod = await importTest('strides');
        mod.createStride('o', 'p', { name: 'S1' });
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/strides', { name: 'S1' });
    });
    it('getProjectMembers calls apiGet and returns response', async () => {
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }]);
        const result = await mod.getProjectMembers('o', 'p');
        expect(result).toEqual([{ id: 1 }]);
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/members');
    });
    it('getProjectMembers returns [] when response is null', async () => {
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce(null);
        const result = await mod.getProjectMembers('o', 'p');
        expect(result).toEqual([]);
    });
    it('getMyPermission calls apiGet and returns permission', async () => {
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce({ permission: 'Edit' });
        const result = await mod.getMyPermission('o', 'p');
        expect(result).toBe('Edit');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/my-permission');
    });
    it('getMyPermission returns undefined when response is null', async () => {
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce(null);
        const result = await mod.getMyPermission('o', 'p');
        expect(result).toBeUndefined();
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
    it('fetchAllNotifications calls apiGet and returns result', async () => {
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }]);
        const result = await mod.fetchAllNotifications();
        expect(result).toEqual([{ id: 1 }]);
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/notifications');
    });
    it('fetchAllNotifications returns [] when apiGet returns null', async () => {
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce(null);
        const result = await mod.fetchAllNotifications();
        expect(result).toEqual([]);
    });
    it('fetchAllNotifications returns [] on api error', async () => {
        const mod = await importTest('notifications');
        mockApi.apiGet.mockRejectedValueOnce(new Error('fail'));
        const result = await mod.fetchAllNotifications();
        expect(result).toEqual([]);
    });
    it('fetchUnreadNotifications is an alias for fetchAllNotifications', async () => {
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
        const result = await mod.fetchUnreadNotifications();
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
    it('markNotificationAsRead calls apiPatch with notification ID', async () => {
        const mod = await importTest('notifications');
        mod.markNotificationAsRead(5);
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/notifications/5', { isRead: true });
    });
    it('markAllNotificationsAsRead calls apiPatch', async () => {
        const mod = await importTest('notifications');
        mod.markAllNotificationsAsRead();
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/notifications', { isRead: true, applyToAll: true });
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
