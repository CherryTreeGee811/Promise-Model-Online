using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class EpicRepository : Repository<Epic>, IEpicRepository
{
    public EpicRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Epic>> GetEpicsByPromiseAsync(int promiseId, int skip, int take)
    {
        return await Context.Epics
            .Where(e => e.ProductPromiseId == promiseId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountEpicsByPromiseAsync(int promiseId)
    {
        return await Context.Epics.CountAsync(e => e.ProductPromiseId == promiseId);
    }

    public async Task<Epic?> GetEpicWithJourneysAsync(int id)
    {
        return await Context.Epics
            .Include(e => e.Journeys)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<List<Epic>> GetEpicsByPromiseOrderedAsync(int promiseId, int skip, int take)
    {
        return await Context.Epics
            .Where(e => e.ProductPromiseId == promiseId)
            .OrderBy(e => e.DisplayOrder)
            .ThenBy(e => e.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }
}
