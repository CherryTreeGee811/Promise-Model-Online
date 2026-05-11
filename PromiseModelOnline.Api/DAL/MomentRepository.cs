using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

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
            // First, get all stride IDs that belong to this iteration
            var strideIds = await _context.Set<Stride>()
                .Where(s => s.IterationId == iterationId)
                .Select(s => s.Id)
                .ToListAsync();

            if (strideIds.Count == 0)
                return Enumerable.Empty<Moment>();

            // Then, find moments assigned to those strides
            var query = _dbSet.Where(m => strideIds.Contains(m.AssignedStrideId.Value));

            if (unassignedOnly)
                query = _dbSet.Where(m => m.AssignedStrideId == null);

            return await query.ToListAsync();
        }
    }
}