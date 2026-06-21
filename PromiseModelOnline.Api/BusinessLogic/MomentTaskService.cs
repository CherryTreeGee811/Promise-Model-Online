using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="MomentTask"/> sub-items with CRUD operations.</summary>
/// <remarks>
///   Not derived from <see cref="GenericService{T}"/>. Delegates to <see cref="IMomentTaskRepository"/>
///   and persists changes immediately. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with the task repository.</remarks>
/// <param name="taskRepository">Repository for moment task data access.</param>
public class MomentTaskService(IMomentTaskRepository taskRepository) : IMomentTaskService
{
    private readonly IMomentTaskRepository _taskRepository = taskRepository;

    /// <summary>Return all sub-tasks belonging to a moment.</summary>
    /// <param name="momentId">The parent moment ID.</param>
    /// <returns>All tasks under the given moment.</returns>
    public async Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId)
        => await _taskRepository.GetTasksByMomentAsync(momentId);

    /// <summary>Find a sub-task by its primary key.</summary>
    /// <param name="taskId">The task ID.</param>
    /// <returns>The matching task, or <c>null</c> if not found.</returns>
    public async Task<MomentTask?> GetByIdAsync(int taskId)
        => await _taskRepository.GetByIdAsync(taskId);

    /// <summary>Create a new sub-task and persist immediately.</summary>
    /// <param name="task">The task to create. Not null.</param>
    /// <returns>The created task.</returns>
    public async Task<MomentTask> CreateAsync(MomentTask task)
    {
        await _taskRepository.AddAsync(task);
        await _taskRepository.SaveChangesAsync();
        return task;
    }

    /// <summary>Update an existing sub-task and persist immediately.</summary>
    /// <param name="task">The task with updated values. Not null.</param>
    /// <returns>The updated task.</returns>
    public async Task<MomentTask> UpdateAsync(MomentTask task)
    {
        _taskRepository.Update(task);
        await _taskRepository.SaveChangesAsync();
        return task;
    }
}
