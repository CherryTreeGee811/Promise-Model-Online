import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = { apiGet: vi.fn(), apiGetList: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() };
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => mockApi);

beforeEach(() => { vi.clearAllMocks(); });

async function importTest(name: string) {
    return import(`../../PromiseModelOnline.Client/wwwroot/js/${name}/api.ts`);
}

describe('promises/api', () => {
    it('getPromise calls apiGet with correct URL', async () => {
        // Arrange
        const mod = await importTest('promises');
        // Act
        mod.getPromise('owner1', 'proj1', '5');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/owner1/proj1/promises/5');
    });
    it('getEpicsByPromise calls apiGet with promiseSeq query', async () => {
        // Arrange
        const mod = await importTest('promises');
        // Act
        mod.getEpicsByPromise('o', 'p', '3');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/epics?promiseSeq=3');
    });
    it('createPromise calls apiPost with data', async () => {
        // Arrange
        const mod = await importTest('promises');
        // Act
        mod.createPromise('o', 'p', { statement: 'test' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/promises/create', { statement: 'test' });
    });
    it('updatePromiseDescription calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('promises');
        // Act
        mod.updatePromiseDescription('o', 'p', '1', 'new desc');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/promises/1/description', { description: 'new desc' });
    });
});

describe('epics/api', () => {
    it('getEpic builds URL with sequenceNumber', async () => {
        // Arrange
        const mod = await importTest('epics');
        // Act
        mod.getEpic('o', 'p', '7');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/epics/7');
    });
    it('getJourneys builds URL with epicSeq', async () => {
        // Arrange
        const mod = await importTest('epics');
        // Act
        mod.getJourneys('o', 'p', '2');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/journeys?epicSeq=2');
    });
    it('createEpic calls apiPost', async () => {
        // Arrange
        const mod = await importTest('epics');
        // Act
        mod.createEpic('o', 'p', { statement: 'E1' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/epics/create', { statement: 'E1' });
    });
});

describe('flows/api', () => {
    it('getFlow builds URL', async () => {
        // Arrange
        const mod = await importTest('flows');
        // Act
        mod.getFlow('o', 'p', '4');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/flows/4');
    });
    it('getMoments builds URL with flowSeq', async () => {
        // Arrange
        const mod = await importTest('flows');
        // Act
        mod.getMoments('o', 'p', '4');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments?flowSeq=4');
    });
});

describe('journeys/api', () => {
    it('getJourney builds URL', async () => {
        // Arrange
        const mod = await importTest('journeys');
        // Act
        mod.getJourney('o', 'p', '2');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/journeys/2');
    });
    it('getFlows builds URL with journeySeq', async () => {
        // Arrange
        const mod = await importTest('journeys');
        // Act
        mod.getFlows('o', 'p', '2');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/flows?journeySeq=2');
    });
});

describe('moments/api', () => {
    it('getMoment builds URL', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.getMoment('o', 'p', '100');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments/100');
    });
    it('getMoment with flowId appends flowId param', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.getMoment('o', 'p', '100', 42);
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/moments/100?flowId=42');
    });
    it('createMoment calls apiPost', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.createMoment('o', 'p', { text: 'test' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/create', { text: 'test' });
    });
    it('getMyAssignedMoments calls apiGet', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.getMyAssignedMoments();
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/moments/assigned-to-me');
    });
    it('updateMomentStatus calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentStatus('o', 'p', '100', 'Done');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/100/status', { newStatus: 'Done' });
    });
    it('updateMomentStatus with flowId includes flowId', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentStatus('o', 'p', '100', 'Done', 7);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/100/status?flowId=7', { newStatus: 'Done' });
    });
    it('assignMomentToStride calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.assignMomentToStride('o', 'p', '1', '10');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/stride-assignment', { strideId: '10' });
    });
    it('assignMomentToStride with flowId includes flowId', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.assignMomentToStride('o', 'p', '1', '10', 42);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/stride-assignment?flowId=42', { strideId: '10' });
    });
    it('updateMomentEstimate calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentEstimate('o', 'p', '1', '5d');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/estimate', { estimate: '5d' });
    });
    it('updateMomentEstimate with undefined estimate', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentEstimate('o', 'p', '1', undefined);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/estimate', { estimate: undefined });
    });
    it('updateMomentType calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentType('o', 'p', '1', 'Bug');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/type', { newType: 'Bug' });
    });
    it('updateMomentOwner calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentOwner('o', 'p', '1', 'user1');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/owner', { userId: 'user1' });
    });
    it('updateMomentDescription calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateMomentDescription('o', 'p', '1', 'new desc');
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/description', { description: 'new desc' });
    });
    it('createTask calls apiPost', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.createTask('o', 'p', '100', { name: 'task1' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/100/tasks', { name: 'task1' });
    });
    it('createTask with flowId includes flowId', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.createTask('o', 'p', '100', { name: 'task1' }, 99);
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/moments/100/tasks?flowId=99', { name: 'task1' });
    });
    it('updateTaskCompletion calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateTaskCompletion('o', 'p', '1', 'task1', true);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/tasks/task1/completion', { isCompleted: true });
    });
    it('updateTaskCompletion with flowId includes flowId', async () => {
        // Arrange
        const mod = await importTest('moments');
        // Act
        mod.updateTaskCompletion('o', 'p', '1', 'task1', true, 55);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/projects/o/p/moments/1/tasks/task1/completion?flowId=55', { isCompleted: true });
    });
});

describe('strides/api', () => {
    it('getStrides calls apiGetList', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getStrides('o', 'p');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/strides');
    });
    it('getStridesByIteration calls apiGetList with iterationId', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getStridesByIteration('o', 'p', '3');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/strides?iterationId=3');
    });
    it('getMomentsByStride calls apiGetList with strideId', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getMomentsByStride('o', 'p', '5');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?strideId=5');
    });
    it('getMomentsByIteration calls apiGetList without unassigned', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getMomentsByIteration('o', 'p', '2');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?iterationId=2');
    });
    it('getMomentsByIteration with isUnassigned adds unassigned=true', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getMomentsByIteration('o', 'p', '2', true);
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/moments?iterationId=2&unassigned=true');
    });
    it('getIterations calls apiGetList', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.getIterations('o', 'p');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/iterations');
    });
    it('createStride calls apiPost with data', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.createStride('o', 'p', { name: 'S1' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/strides', { name: 'S1' });
    });
    it('getProjectMembers calls apiGet and returns response', async () => {
        // Arrange
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }]);
        // Act
        const result = await mod.getProjectMembers('o', 'p');
        // Assert
        expect(result).toEqual([{ id: 1 }]);
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/members');
    });
    it('getProjectMembers returns [] when response is null', async () => {
        // Arrange
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce(null);
        // Act
        const result = await mod.getProjectMembers('o', 'p');
        // Assert
        expect(result).toEqual([]);
    });
    it('getMyPermission calls apiGet and returns permission', async () => {
        // Arrange
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce({ permission: 'Edit' });
        // Act
        const result = await mod.getMyPermission('o', 'p');
        // Assert
        expect(result).toBe('Edit');
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/my-permission');
    });
    it('getMyPermission returns undefined when response is null', async () => {
        // Arrange
        const mod = await importTest('strides');
        mockApi.apiGet.mockResolvedValueOnce(null);
        // Act
        const result = await mod.getMyPermission('o', 'p');
        // Assert
        expect(result).toBeUndefined();
    });
    it('progressStride calls apiPost', async () => {
        // Arrange
        const mod = await importTest('strides');
        // Act
        mod.progressStride('o', 'p', '10');
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalledWith('/api/projects/o/p/strides/10/progress', {});
    });
});

describe('iterations/api', () => {
    it('getIterations calls apiGetList', async () => {
        // Arrange
        const mod = await importTest('iterations');
        // Act
        mod.getIterations('o', 'p');
        // Assert
        expect(mockApi.apiGetList).toHaveBeenCalledWith('/api/projects/o/p/iterations');
    });
    it('getBurndown calls apiGet', async () => {
        // Arrange
        const mod = await importTest('iterations');
        // Act
        mod.getBurndown('o', 'p', '1');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/projects/o/p/iterations/1/burndown');
    });
});

describe('comments/api', () => {
    it('getComments calls apiGet', async () => {
        // Arrange
        const mod = await importTest('comments');
        // Act
        mod.getComments('Moment', 100, 'o', 'p');
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalled();
    });
});

describe('reactions/api', () => {
    it('addReaction calls apiPost', async () => {
        // Arrange
        const mod = await importTest('reactions');
        // Act
        mod.addReaction('o', 'p', { emoji: '👍' });
        // Assert
        expect(mockApi.apiPost).toHaveBeenCalled();
    });
});

describe('notifications/api', () => {
    it('fetchAllNotifications calls apiGet and returns result', async () => {
        // Arrange
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }]);
        // Act
        const result = await mod.fetchAllNotifications();
        // Assert
        expect(result).toEqual([{ id: 1 }]);
        expect(mockApi.apiGet).toHaveBeenCalledWith('/api/notifications');
    });
    it('fetchAllNotifications returns [] when apiGet returns null', async () => {
        // Arrange
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce(null);
        // Act
        const result = await mod.fetchAllNotifications();
        // Assert
        expect(result).toEqual([]);
    });
    it('fetchAllNotifications returns [] on api error', async () => {
        // Arrange
        const mod = await importTest('notifications');
        mockApi.apiGet.mockRejectedValueOnce(new Error('fail'));
        // Act
        const result = await mod.fetchAllNotifications();
        // Assert
        expect(result).toEqual([]);
    });
    it('fetchUnreadNotifications is an alias for fetchAllNotifications', async () => {
        // Arrange
        const mod = await importTest('notifications');
        mockApi.apiGet.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
        // Act
        const result = await mod.fetchUnreadNotifications();
        // Assert
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
    it('markNotificationAsRead calls apiPatch with notification ID', async () => {
        // Arrange
        const mod = await importTest('notifications');
        // Act
        mod.markNotificationAsRead(5);
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/notifications/5', { isRead: true });
    });
    it('markAllNotificationsAsRead calls apiPatch', async () => {
        // Arrange
        const mod = await importTest('notifications');
        // Act
        mod.markAllNotificationsAsRead();
        // Assert
        expect(mockApi.apiPatch).toHaveBeenCalledWith('/api/notifications', { isRead: true, applyToAll: true });
    });
});

describe('invitations/api', () => {
    it('getPendingInvitations calls apiGet', async () => {
        // Arrange
        const mod = await importTest('invitations');
        // Act
        mod.getPendingInvitations();
        // Assert
        expect(mockApi.apiGet).toHaveBeenCalled();
    });
});

describe('projects/api', () => {
    it('getGraphData calls authFetch', async () => {
        // Arrange
        const mod = await importTest('projects');
        // Act
        try { await mod.getGraphData('o', 'p'); } catch {}
        // Assert
        expect(mockApi.authFetch).toHaveBeenCalledWith('/api/projects/o/p/graph');
    });
    it('createProject calls authFetch POST', async () => {
        // Arrange
        const mod = await importTest('projects');
        // Act
        try { await mod.createProject({ name: 'P1' }); } catch {}
        // Assert
        expect(mockApi.authFetch).toHaveBeenCalledWith('/api/projects/create', expect.objectContaining({
            method: 'POST', body: JSON.stringify({ name: 'P1' }),
        }));
    });
});
