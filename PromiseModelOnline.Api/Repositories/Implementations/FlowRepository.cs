using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class FlowRepository : Repository<Flow>, IFlowRepository
{
    public FlowRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Flow>> GetFlowsByJourneyAsync(int journeyId, int skip, int take)
    {
        return await Context.Flows
            .Where(f => f.JourneyId == journeyId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountFlowsByJourneyAsync(int journeyId)
    {
        return await Context.Flows.CountAsync(f => f.JourneyId == journeyId);
    }

    public async Task<Flow?> GetFlowWithMomentsAsync(int id)
    {
        return await Context.Flows
            .Include(f => f.Moments)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<Flow>> GetFlowsByJourneyOrderedAsync(int journeyId, int skip, int take)
    {
        return await Context.Flows
            .Where(f => f.JourneyId == journeyId)
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }
}
