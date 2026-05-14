using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DAL
{
    public class MomentRepository : GenericRepository<Moment>, IMomentRepository
    {
        public MomentRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
        {
            return await FindAsync(m => m.FlowId == flowId);
        }

        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
        {
            return await FindAsync(m => m.AssignedStrideId == strideId);
        }

        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
        {
            var strideIds = await _context.Set<Stride>()
                .Where(s => s.IterationId == iterationId)
                .Select(s => s.Id)
                .ToListAsync();

            if (strideIds.Count == 0)
                return Enumerable.Empty<Moment>();

            var query = _dbSet.Where(m => m.AssignedStrideId.HasValue && strideIds.Contains(m.AssignedStrideId.Value));

            if (unassignedOnly)
                query = _dbSet.Where(m => m.AssignedStrideId == null);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
        {
            return await FindAsync(m => m.OwnerId == ownerId);
        }

        public async Task<IEnumerable<Moment>> GetMomentsByPromiseIdAsync(int promiseId)
        {
            return await _dbSet
                .Where(m => m.Flow.Journey.Epic.ProductPromiseId == promiseId)
                .ToListAsync();
        }

        public async Task<int?> GetProjectIdForMomentAsync(int momentId)
        {
            return await _dbSet
                .Where(m => m.Id == momentId)
                .Select(m => m.Flow.Journey.Epic.ProductPromise.ProjectId)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Moment>> GetUnfinishedMomentsByStrideAsync(int strideId)
        {
            return await FindAsync(m => m.AssignedStrideId == strideId && m.Status != MomentStatus.Done);
        }
    }
}