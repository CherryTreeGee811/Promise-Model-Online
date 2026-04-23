using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Project>> GetProjectsByOwnerAsync(int ownerId, int skip, int take)
    {
        return await Context.Projects
            .Where(p => p.OwnerId == ownerId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountProjectsByOwnerAsync(int ownerId)
    {
        return await Context.Projects.CountAsync(p => p.OwnerId == ownerId);
    }

    public async Task<Project?> GetProjectWithPromisesAsync(int id)
    {
        return await Context.Projects
            .Include(p => p.ProductPromises)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
