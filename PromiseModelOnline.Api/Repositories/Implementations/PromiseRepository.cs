using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class PromiseRepository : Repository<Promise>, IPromiseRepository
{
    public PromiseRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Promise>> GetPromisesByProjectAsync(int projectId, int skip, int take)
    {
        return await Context.Promises
            .Where(p => p.ProjectId == projectId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountPromisesByProjectAsync(int projectId)
    {
        return await Context.Promises.CountAsync(p => p.ProjectId == projectId);
    }

    public async Task<Promise?> GetPromiseWithEpicsAsync(int id)
    {
        return await Context.Promises
            .Include(p => p.Epics)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<Promise>> GetPromisesByProjectOrderedAsync(int projectId, int skip, int take)
    {
        return await Context.Promises
            .Where(p => p.ProjectId == projectId)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }
}
