using Microsoft.EntityFrameworkCore;
using PMO.Core.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>EF Core implementation of <see cref="IMomentTaskRepository"/> providing moment-scoped sub-task lookups.</summary>
    /// <remarks>
    ///   Scoped lifetime. Results are ordered by ID ascending.
    /// </remarks>
    public class MomentTaskRepository : GenericRepository<MomentTask>, IMomentTaskRepository
    {
        /// <summary>Initializes the repository with the shared database context.</summary>
        /// <param name="context">The EF Core database context.</param>
        public MomentTaskRepository(PromiseModelOnlineContext context) : base(context) { }

        /// <summary>Return all sub-tasks belonging to a moment, ordered by ID.</summary>
        /// <param name="momentId">The parent moment ID. Must be greater than zero.</param>
        /// <returns>Ordered collection of tasks under the moment.</returns>
        public async Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId)
        {
            return await _context.Set<MomentTask>()
                .Where(task => task.MomentId == momentId)
                .OrderBy(task => task.Id)
                .ToListAsync();
        }
    }
}
