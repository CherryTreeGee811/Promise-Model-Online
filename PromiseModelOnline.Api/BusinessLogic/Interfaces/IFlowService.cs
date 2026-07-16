using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Flow"/> business logic scoped to a parent journey.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with journey-scoped flow queries.
///   Scoped lifetime.
/// </remarks>
public interface IFlowService : IGenericService<Flow>
{
    /// <summary>Return all flows belonging to a journey.</summary>
    /// <param name="journeyId">The parent journey ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All flows under the given journey.</returns>
    Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId, CancellationToken cancellationToken = default);
}
