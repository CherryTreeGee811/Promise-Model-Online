using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Moment"/> entities with the richest filter set.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with queries scoped by flow, stride, iteration
///   (with unassigned-only flag), owner, product promise, and completion status. Also provides
///   hierarchy traversal to resolve the root project ID. Scoped lifetime.
/// </remarks>
public interface IMomentRepository : IGenericRepository<Moment>
{
    /// <summary>Return moments belonging to a flow.</summary>
    /// <param name="flowId">Parent <c>FlowId</c>. Must be greater than zero.</param>
    /// <returns>All moments under the given flow.</returns>
    Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId);

    /// <summary>Return moments assigned to a stride (sprint).</summary>
    /// <param name="strideId">The <c>AssignedStrideId</c>. Must be greater than zero.</param>
    /// <returns>All moments in the given stride.</returns>
    Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId);

    /// <summary>Return moments in an iteration, optionally unassigned only.</summary>
    /// <remarks>
    ///   When <paramref name="unassignedOnly"/> is <c>true</c>, returns moments in the iteration's
    ///   project that have no stride assignment. Otherwise, returns moments assigned to one of the
    ///   iteration's strides.
    /// </remarks>
    /// <param name="iterationId">The iteration ID. Must be greater than zero.</param>
    /// <param name="unassignedOnly">If <c>true</c>, only moments without a stride assignment.</param>
    /// <returns>Matching moments.</returns>
    Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false);

    /// <summary>Return moments owned by a user.</summary>
    /// <param name="ownerId">The owner's user ID. Must be greater than zero.</param>
    /// <returns>Moments where <c>OwnerId == ownerId</c>.</returns>
    Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId);

    /// <summary>Return moments under a product promise.</summary>
    /// <remarks>
    ///   Traverses the hierarchy: moment -> flow -> journey -> epic -> promise.
    /// </remarks>
    /// <param name="promiseId">The product promise ID. Must be greater than zero.</param>
    /// <returns>Moments scoped to the promise tree.</returns>
    Task<IEnumerable<Moment>> GetMomentsByPromiseIdAsync(int promiseId);

    /// <summary>Resolve the root project ID for a moment.</summary>
    /// <remarks>
    ///   Walks the ancestor chain (moment -> flow -> journey -> epic -> promise -> project).
    ///   Returns <c>null</c> if any ancestor is missing.
    /// </remarks>
    /// <param name="momentId">The moment ID. Must be greater than zero.</param>
    /// <returns>Root project ID, or <c>null</c> if not found.</returns>
    Task<int?> GetProjectIdForMomentAsync(int momentId);

    /// <summary>Return unfinished moments in a stride.</summary>
    /// <remarks>
    ///   <c>Unfinished</c> means <c>Status != MomentStatus.Done</c>.
    /// </remarks>
    /// <param name="strideId">The stride ID. Must be greater than zero.</param>
    /// <returns>Moments in the stride that are not yet complete.</returns>
    Task<IEnumerable<Moment>> GetUnfinishedMomentsByStrideAsync(int strideId);
}
