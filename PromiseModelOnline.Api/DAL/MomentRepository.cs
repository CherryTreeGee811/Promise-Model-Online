using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DAL
{
    public class MomentRepository : GenericRepository<Moment>, IMomentRepository
    {
        public MomentRepository(PromiseModelOnlineContext context) : base(context) { }

        public new async Task<IEnumerable<Moment>> GetAllAsync()
        {
            return await BuildMomentQuery().ToListAsync();
        }

        public new async Task<Moment?> GetByIdAsync(object id)
        {
            if (!TryGetMomentId(id, out var momentId))
            {
                return null;
            }

            return await BuildMomentQuery().FirstOrDefaultAsync(moment => moment.Id == momentId);
        }

        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.FlowId == flowId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.AssignedStrideId == strideId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
        {
            var strideIds = await _context.Set<Stride>()
                .Where(s => s.IterationId == iterationId)
                .Select(s => s.Id)
                .ToListAsync();

            if (strideIds.Count == 0)
                return Enumerable.Empty<Moment>();

            var query = BuildMomentQuery().Where(moment => moment.AssignedStrideId.HasValue && strideIds.Contains(moment.AssignedStrideId.Value));

            if (unassignedOnly)
                query = BuildMomentQuery().Where(moment => moment.AssignedStrideId == null);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.OwnerId == ownerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByPromiseIdAsync(int promiseId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.Flow.Journey.Epic.ProductPromiseId == promiseId)
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
            return await BuildMomentQuery()
                .Where(moment => moment.AssignedStrideId == strideId && moment.Status != MomentStatus.Done)
                .ToListAsync();
        }

        private IQueryable<Moment> BuildMomentQuery()
        {
            return _context.Set<Moment>().Include(moment => moment.Tasks);
        }

        private static bool TryGetMomentId(object id, out int momentId)
        {
            switch (id)
            {
                case int intId:
                    momentId = intId;
                    return true;
                case string stringId when int.TryParse(stringId, out var parsedId):
                    momentId = parsedId;
                    return true;
                default:
                    momentId = default;
                    return false;
            }
        }
    }
}