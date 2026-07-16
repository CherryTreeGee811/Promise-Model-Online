using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Epic"/> business logic scoped to a product promise.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with promise-scoped epic queries.
///   Scoped lifetime.
/// </remarks>
public interface IEpicService : IGenericService<Epic>
{
    /// <summary>Return all epics belonging to a product promise.</summary>
    /// <param name="promiseId">The parent product promise ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All epics under the given promise.</returns>
    Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId, CancellationToken cancellationToken = default);
}
