using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IFlowRepository : IRepository<Flow>
{
    Task<List<Flow>> GetFlowsByJourneyAsync(int journeyId, int skip, int take);
    Task<int> CountFlowsByJourneyAsync(int journeyId);
    Task<Flow?> GetFlowWithMomentsAsync(int id);
    Task<List<Flow>> GetFlowsByJourneyOrderedAsync(int journeyId, int skip, int take);
}
