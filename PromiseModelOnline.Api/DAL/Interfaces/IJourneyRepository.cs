using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Journey"/> entities scoped to a parent epic.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with an epic-scoped lookup.
///   Scoped lifetime.
/// </remarks>
public interface IJourneyRepository : IGenericRepository<Journey>
{
    /// <summary>Return all journeys belonging to an epic.</summary>
    /// <param name="epicId">The parent <c>EpicId</c>. Must be greater than zero.</param>
    /// <returns>All journeys under the given epic. Empty if none exist.</returns>
    Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId);
}
