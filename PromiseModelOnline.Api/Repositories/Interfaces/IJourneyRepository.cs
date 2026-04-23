using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IJourneyRepository : IRepository<Journey>
{
    Task<List<Journey>> GetJourneysByEpicAsync(int epicId, int skip, int take);
    Task<int> CountJourneysByEpicAsync(int epicId);
    Task<Journey?> GetJourneyWithFlowsAsync(int id);
    Task<List<Journey>> GetJourneysByEpicOrderedAsync(int epicId, int skip, int take);
}
