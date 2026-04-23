using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IMomentRepository : IRepository<Moment>
{
    Task<List<Moment>> GetMomentsByFlowAsync(int flowId, int skip, int take);
    Task<int> CountMomentsByFlowAsync(int flowId);
    Task<Moment?> GetMomentWithTasksAsync(int id);
    Task<List<Moment>> GetMomentsByFlowOrderedAsync(int flowId, int skip, int take);
    Task<List<Moment>> GetMomentsByStatusAsync(MomentStatus status, int skip, int take);
    Task<List<Moment>> GetMomentsByOwnerAsync(int ownerId, int skip, int take);
}
