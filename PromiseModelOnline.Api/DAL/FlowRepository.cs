using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IFlowRepository"/> providing journey-scoped flow lookups.</summary>
/// <remarks>
///   Uses the base class FindAsync method with a lambda predicate.
///   Scoped lifetime; one instance per request.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class FlowRepository(PromiseModelOnlineContext context) : GenericRepository<Flow>(context), IFlowRepository
{

    /// <summary>Return all flows belonging to a journey.</summary>
    /// <param name="journeyId">The parent journey ID. Must be greater than zero.</param>
    /// <returns>All flows under the given journey. Empty if none exist.</returns>
    public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId) => await FindAsync(f => f.JourneyId == journeyId);
}
