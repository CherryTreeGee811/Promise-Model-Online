using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class JourneyRepository : Repository<Journey>, IJourneyRepository
{
    public JourneyRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Journey>> GetJourneysByEpicAsync(int epicId, int skip, int take)
    {
        return await Context.Journeys
            .Where(j => j.EpicId == epicId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountJourneysByEpicAsync(int epicId)
    {
        return await Context.Journeys.CountAsync(j => j.EpicId == epicId);
    }

    public async Task<Journey?> GetJourneyWithFlowsAsync(int id)
    {
        return await Context.Journeys
            .Include(j => j.Flows)
            .FirstOrDefaultAsync(j => j.Id == id);
    }

    public async Task<List<Journey>> GetJourneysByEpicOrderedAsync(int epicId, int skip, int take)
    {
        return await Context.Journeys
            .Where(j => j.EpicId == epicId)
            .OrderBy(j => j.DisplayOrder)
            .ThenBy(j => j.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }
}
