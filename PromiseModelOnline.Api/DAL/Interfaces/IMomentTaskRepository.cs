using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="MomentTask"/> sub-items.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with a single lookup scoped to a parent
///   moment. Scoped lifetime.
/// </remarks>
public interface IMomentTaskRepository : IGenericRepository<MomentTask>
{
    /// <summary>Return all sub-tasks belonging to a moment.</summary>
    /// <param name="momentId">The parent <c>MomentId</c>. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Ordered collection of tasks under the moment.</returns>
    Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId, CancellationToken cancellationToken = default);
}
