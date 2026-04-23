using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class MomentRepository : Repository<Moment>, IMomentRepository
{
    public MomentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Moment>> GetMomentsByFlowAsync(int flowId, int skip, int take)
    {
        return await Context.Moments
            .Where(m => m.FlowId == flowId)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountMomentsByFlowAsync(int flowId)
    {
        return await Context.Moments.CountAsync(m => m.FlowId == flowId);
    }

    public async Task<Moment?> GetMomentWithTasksAsync(int id)
    {
        return await Context.Moments
            .Include(m => m.Tasks)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<List<Moment>> GetMomentsByFlowOrderedAsync(int flowId, int skip, int take)
    {
        return await Context.Moments
            .Where(m => m.FlowId == flowId)
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<Moment>> GetMomentsByStatusAsync(MomentStatus status, int skip, int take)
    {
        return await Context.Moments
            .Where(m => m.Status == status)
            .OrderBy(m => m.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<Moment>> GetMomentsByOwnerAsync(int ownerId, int skip, int take)
    {
        return await Context.Moments
            .Where(m => m.OwnerId == ownerId)
            .OrderBy(m => m.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }
}
