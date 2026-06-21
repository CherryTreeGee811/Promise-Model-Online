using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IEpicRepository"/> providing promise-scoped epic lookups.</summary>
/// <remarks>
///   Uses the base class FindAsync method with a lambda predicate.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class EpicRepository(PromiseModelOnlineContext context) : GenericRepository<Epic>(context), IEpicRepository
{

    /// <summary>Return all epics belonging to a product promise.</summary>
    /// <param name="promiseId">The parent product promise ID. Must be greater than zero.</param>
    /// <returns>All epics under the given promise. Empty if none exist.</returns>
    public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId) => await FindAsync(e => e.ProductPromiseId == promiseId);
}
