using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
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
    /// <returns>All tasks under the given moment.</returns>
    Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId);

    /// <summary>Find a sub-task by its primary key.</summary>
    /// <param name="taskId">The task ID. Must be greater than zero.</param>
    /// <returns>The matching task, or <c>null</c> if not found.</returns>
    Task<MomentTask?> GetByIdAsync(int taskId);

    /// <summary>Create a new sub-task with validation.</summary>
    /// <param name="task">The task to create. Not null.</param>
    /// <returns>The created task.</returns>
    Task<MomentTask> CreateAsync(MomentTask task);

    /// <summary>Update an existing sub-task with validation.</summary>
    /// <param name="task">The task with updated values. Not null.</param>
    /// <returns>The updated task.</returns>
    Task<MomentTask> UpdateAsync(MomentTask task);
}
