using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>Service for <see cref="Journey"/> business logic scoped to a parent epic.</summary>
    /// <remarks>
    ///   Builds on <see cref="IGenericService{T}"/> with epic-scoped journey queries.
    ///   Scoped lifetime.
    /// </remarks>
    public interface IJourneyService : IGenericService<Journey>
    {
        /// <summary>Return all journeys belonging to an epic.</summary>
        /// <param name="epicId">The parent epic ID. Must be greater than zero.</param>
        /// <returns>All journeys under the given epic.</returns>
        Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId);
    }
}
