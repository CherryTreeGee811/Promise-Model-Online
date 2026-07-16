using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Epic"/> entities scoped to a product promise.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with a single lookup that retrieves
///   all epics under a given product promise. Scoped lifetime.
/// </remarks>
public interface IEpicRepository : IGenericRepository<Epic>
{
    /// <summary>Return all epics belonging to a product promise.</summary>
    /// <param name="promiseId">The parent <c>ProductPromiseId</c>. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All epics under the given promise. Empty if none exist.</returns>
    Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId, CancellationToken cancellationToken = default);
}
