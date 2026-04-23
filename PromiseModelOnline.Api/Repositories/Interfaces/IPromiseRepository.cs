using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IPromiseRepository : IRepository<Promise>
{
    Task<List<Promise>> GetPromisesByProjectAsync(int projectId, int skip, int take);
    Task<int> CountPromisesByProjectAsync(int projectId);
    Task<Promise?> GetPromiseWithEpicsAsync(int id);
    Task<List<Promise>> GetPromisesByProjectOrderedAsync(int projectId, int skip, int take);
}
