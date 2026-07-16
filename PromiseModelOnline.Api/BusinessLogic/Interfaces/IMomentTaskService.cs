using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="MomentTask"/> sub-items within a moment.</summary>
/// <remarks>
///   Not derived from <see cref="IGenericService{T}"/>. Provides moment-scoped queries,
///   CRUD operations, and business validation for sub-tasks. Scoped lifetime.
/// </remarks>
public interface IMomentTaskService
{
    /// <summary>Return all sub-tasks belonging to a moment.</summary>
    /// <param name="momentId">The parent moment ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All tasks under the given moment.</returns>
    Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId, CancellationToken cancellationToken = default);

    /// <summary>Find a sub-task by its primary key.</summary>
    /// <param name="taskId">The task ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matching task, or <c>null</c> if not found.</returns>
    Task<MomentTask?> GetByIdAsync(int taskId, CancellationToken cancellationToken = default);

    /// <summary>Create a new sub-task with validation.</summary>
    /// <param name="task">The task to create. Not null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created task.</returns>
    Task<MomentTask> CreateAsync(MomentTask task, CancellationToken cancellationToken = default);

    /// <summary>Update an existing sub-task with validation.</summary>
    /// <param name="task">The task with updated values. Not null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated task.</returns>
    Task<MomentTask> UpdateAsync(MomentTask task, CancellationToken cancellationToken = default);
}
