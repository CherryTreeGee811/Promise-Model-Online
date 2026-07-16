using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IJourneyRepository"/> providing epic-scoped journey lookups.</summary>
/// <remarks>
///   Uses the base class FindAsync method with a lambda predicate.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class JourneyRepository(PromiseModelOnlineContext context) : GenericRepository<Journey>(context), IJourneyRepository
{

    /// <summary>Return all journeys belonging to an epic.</summary>
    /// <param name="epicId">The parent epic ID. Must be greater than zero.</param>
    /// <returns>All journeys under the given epic. Empty if none exist.</returns>
    public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId, CancellationToken cancellationToken = default) => await FindAsync(j => j.EpicId == epicId, cancellationToken);
}
