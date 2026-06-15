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
    /// <summary>EF Core implementation of <see cref="IMomentRepository"/> with the richest set of query filters in the system.</summary>
    /// <remarks>
    ///   All public read methods eagerly load the moment's ancestor chain (Flow -> Journey -> Epic -> ProductPromise)
    ///   and sub-tasks via <see cref="BuildMomentQuery"/> to avoid N+1 queries in the UI.
    ///   Scoped lifetime.
    /// </remarks>
    public class MomentRepository : GenericRepository<Moment>, IMomentRepository
    {
        /// <summary>Initializes the repository with the shared database context.</summary>
        /// <param name="context">The EF Core database context.</param>
        public MomentRepository(PromiseModelOnlineContext context) : base(context) { }

        /// <summary>Return all moments with their ancestor chain and sub-tasks eagerly loaded.</summary>
        /// <returns>All moments with lineage metadata.</returns>
        public new async Task<IEnumerable<Moment>> GetAllAsync()
        {
            return await BuildMomentQuery().ToListAsync();
        }

        /// <summary>Find a moment by its primary key, supporting both <c>int</c> and parseable <c>string</c> IDs.</summary>
        /// <param name="id">The moment's primary key. Accepts <c>int</c> or a numeric <c>string</c>.</param>
        /// <returns>The matching moment with lineage loaded, or <c>null</c> if the ID format is invalid or not found.</returns>
        public new async Task<Moment?> GetByIdAsync(object id)
        {
            if (!TryGetMomentId(id, out var momentId))
            {
                return null;
            }

            return await BuildMomentQuery().FirstOrDefaultAsync(moment => moment.Id == momentId);
        }

        /// <summary>Return all moments belonging to a flow.</summary>
        /// <param name="flowId">The parent flow ID. Must be greater than zero.</param>
        /// <returns>All moments under the given flow with lineage loaded.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.FlowId == flowId)
                .ToListAsync();
        }

        /// <summary>Return all moments assigned to a stride (sprint).</summary>
        /// <param name="strideId">The stride ID. Must be greater than zero.</param>
        /// <returns>All moments in the given stride with lineage loaded.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.AssignedStrideId == strideId)
                .ToListAsync();
        }

        /// <summary>Return moments in an iteration, with an option to filter for unassigned moments only.</summary>
        /// <remarks>
        ///   When <paramref name="unassignedOnly"/> is <c>true</c>, returns moments that belong to the
        ///   iteration's project but have no stride assignment. Otherwise, returns moments assigned to
        ///   one of the iteration's strides. Returns empty if the iteration has no strides and
        ///   <paramref name="unassignedOnly"/> is <c>false</c>.
        /// </remarks>
        /// <param name="iterationId">The iteration ID. Must be greater than zero.</param>
        /// <param name="unassignedOnly">If <c>true</c>, only moments without a stride assignment are returned.</param>
        /// <returns>Matching moments with lineage loaded.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
        {
            var iteration = await _context.Set<Iteration>()
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == iterationId);

            if (iteration is null)
                return Enumerable.Empty<Moment>();

            var strideIds = await _context.Set<Stride>()
                .Where(s => s.IterationId == iterationId)
                .Select(s => s.Id)
                .ToListAsync();

            var query = BuildMomentQuery()
                .Where(moment => moment.Flow.Journey.Epic.ProductPromise.ProjectId == iteration.ProjectId);

            if (unassignedOnly)
            {
                query = query.Where(moment => moment.AssignedStrideId == null);
            }
            else if (strideIds.Count > 0)
            {
                query = query.Where(moment => moment.AssignedStrideId.HasValue && strideIds.Contains(moment.AssignedStrideId.Value));
            }
            else
            {
                return Enumerable.Empty<Moment>();
            }

            return await query.ToListAsync();
        }

        /// <summary>Return all moments assigned to a specific owner.</summary>
        /// <param name="ownerId">The owner's user ID. Must be greater than zero.</param>
        /// <returns>Moments where <c>OwnerId == ownerId</c>, with lineage loaded.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.OwnerId == ownerId)
                .ToListAsync();
        }

        /// <summary>Return all moments scoped to a product promise, traversing the full hierarchy.</summary>
        /// <param name="promiseId">The product promise ID. Must be greater than zero.</param>
        /// <returns>Moments under the promise tree with lineage loaded.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByPromiseIdAsync(int promiseId)
        {
            return await BuildMomentQuery()
                .Where(moment => moment.Flow.Journey.Epic.ProductPromiseId == promiseId)
                .ToListAsync();
        }

        /// <summary>Resolve the root project ID for a moment by walking the ancestor chain.</summary>
        /// <remarks>
        ///   Traverses: moment -> flow -> journey -> epic -> promise -> project.
        ///   Uses a server-side projection so only the project ID is fetched.
        /// </remarks>
        /// <param name="momentId">The moment ID. Must be greater than zero.</param>
        /// <returns>The root project ID, or <c>null</c> if the moment or any ancestor is missing.</returns>
        public async Task<int?> GetProjectIdForMomentAsync(int momentId)
        {
            return await _dbSet
                .Where(m => m.Id == momentId)
                .Select(m => m.Flow.Journey.Epic.ProductPromise.ProjectId)
                .FirstOrDefaultAsync();
        }

        /// <summary>Return unfinished moments in a stride.</summary>
        /// <remarks>
        ///   <c>Unfinished</c> is defined as <see cref="Moment.Status"/> != <see cref="MomentStatus.Done"/>.
        /// </remarks>
        /// <param name="strideId">The stride ID. Must be greater than zero.</param>
        /// <returns>Moments in the stride that are not yet complete.</returns>
        public async Task<IEnumerable<Moment>> GetUnfinishedMomentsByStrideAsync(int strideId)
        {
            return await _context.Set<Moment>()
                .Where(m => m.AssignedStrideId == strideId && m.Status != MomentStatus.Done)
                .ToListAsync();
        }

        /// <summary>Build an <see cref="IQueryable{T}"/> that eagerly loads the moment's ancestor chain and sub-tasks.</summary>
        /// <remarks>
        ///   Includes: Flow -> Journey -> Epic -> ProductPromise, plus the Tasks collection.
        ///   All public read methods in this repository use this query builder.
        /// </remarks>
        /// <returns>A queryable with Include/ThenInclude applied.</returns>
        private IQueryable<Moment> BuildMomentQuery()
        {
            return _context.Set<Moment>()
                .Include(moment => moment.Flow)
                    .ThenInclude(flow => flow.Journey)
                        .ThenInclude(journey => journey.Epic)
                            .ThenInclude(epic => epic.ProductPromise)
                .Include(moment => moment.Tasks);
        }

        /// <summary>Try to parse an <c>object</c> primary key as an <c>int</c>, supporting both <c>int</c> and numeric <c>string</c> inputs.</summary>
        /// <param name="id">The primary key value from the caller.</param>
        /// <param name="momentId">The parsed integer ID when successful.</param>
        /// <returns><c>true</c> if parsing succeeded; <c>false</c> otherwise.</returns>
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
