using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>EF Core implementation of <see cref="IEpicRepository"/> providing promise-scoped epic lookups.</summary>
    /// <remarks>
    ///   Uses the base class <see cref="FindAsync"/> method with a lambda predicate.
    ///   Scoped lifetime.
    /// </remarks>
    public class EpicRepository : GenericRepository<Epic>, IEpicRepository
    {
        /// <summary>Initializes the repository with the shared database context.</summary>
        /// <param name="context">The EF Core database context.</param>
        public EpicRepository(PromiseModelOnlineContext context) : base(context) { }

        /// <summary>Return all epics belonging to a product promise.</summary>
        /// <param name="promiseId">The parent product promise ID. Must be greater than zero.</param>
        /// <returns>All epics under the given promise. Empty if none exist.</returns>
        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
        {
            return await FindAsync(e => e.ProductPromiseId == promiseId);
        }
    }
}
