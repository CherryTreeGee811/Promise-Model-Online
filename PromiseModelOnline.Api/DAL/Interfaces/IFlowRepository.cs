using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Flow"/> entities scoped to a parent journey.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with a journey-scoped lookup.
///   Scoped lifetime; one instance per request.
/// </remarks>
public interface IFlowRepository : IGenericRepository<Flow>
{
    /// <summary>Return all flows belonging to a journey.</summary>
    /// <param name="journeyId">The parent <c>JourneyId</c>. Must be greater than zero.</param>
    /// <returns>All flows under the given journey. Empty if none exist.</returns>
    Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId);
}
