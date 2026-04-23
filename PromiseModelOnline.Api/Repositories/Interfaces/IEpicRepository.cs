using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IEpicRepository : IRepository<Epic>
{
    Task<List<Epic>> GetEpicsByPromiseAsync(int promiseId, int skip, int take);
    Task<int> CountEpicsByPromiseAsync(int promiseId);
    Task<Epic?> GetEpicWithJourneysAsync(int id);
    Task<List<Epic>> GetEpicsByPromiseOrderedAsync(int promiseId, int skip, int take);
}
