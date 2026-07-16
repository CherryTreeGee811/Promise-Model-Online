using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Moment"/> business logic with status transitions, assignment, and burndown.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with operations for flow/stride/iteration/owner
///   scoping, status and estimate updates, stride assignment, effort aggregation, unfinished
///   moment migration, and burndown calculation. Scoped lifetime.
/// </remarks>
public interface IMomentService : IGenericService<Moment>
{
    /// <summary>Return moments belonging to a flow.</summary>
    /// <param name="flowId">The flow ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All moments under the given flow.</returns>
    Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId, CancellationToken cancellationToken = default);

    /// <summary>Return moments assigned to a stride.</summary>
    /// <param name="strideId">The stride ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All moments in the given stride.</returns>
    Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId, CancellationToken cancellationToken = default);

    /// <summary>Return moments in an iteration, with optional unassigned-only filter.</summary>
    /// <param name="iterationId">The iteration ID. Must be greater than zero.</param>
    /// <param name="unassignedOnly">If <c>true</c>, only moments without a stride assignment.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Matching moments.</returns>
    Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false, CancellationToken cancellationToken = default);

    /// <summary>Return moments assigned to a user.</summary>
    /// <param name="ownerId">The owner's user ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Moments owned by the user.</returns>
    Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId, CancellationToken cancellationToken = default);

    /// <summary>Assign or unassign a moment to/from a stride.</summary>
    /// <param name="momentId">The moment ID.</param>
    /// <param name="strideId">The stride ID, or <c>null</c> to unassign.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated moment.</returns>
    Task<Moment> AssignMomentToStrideAsync(int momentId, int? strideId, CancellationToken cancellationToken = default);

    /// <summary>Update a moment's status with business rule validation.</summary>
    /// <param name="momentId">The moment ID.</param>
    /// <param name="newStatus">The target status.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated moment.</returns>
    Task<Moment> UpdateMomentStatusAsync(int momentId, MomentStatus newStatus, CancellationToken cancellationToken = default);

    /// <summary>Update a moment's effort estimate.</summary>
    /// <param name="momentId">The moment ID.</param>
    /// <param name="estimate">The new estimate, or <c>null</c> to clear it.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated moment.</returns>
    Task<Moment> UpdateMomentEstimateAsync(int momentId, Estimate? estimate, CancellationToken cancellationToken = default);

    /// <summary>Calculate the total effort estimate for all moments under a product promise.</summary>
    /// <param name="promiseId">The product promise ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The sum of effort estimates.</returns>
    Task<int> GetTotalEffortForPromiseAsync(int promiseId, CancellationToken cancellationToken = default);

    /// <summary>Assign or unassign an owner to a moment.</summary>
    /// <param name="momentId">The moment ID.</param>
    /// <param name="userId">The owner's user ID, or <c>null</c> to clear assignment.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated moment.</returns>
    Task<Moment> AssignOwnerAsync(int momentId, int? userId, CancellationToken cancellationToken = default);

    /// <summary>Resolve the root project ID for a moment.</summary>
    /// <param name="momentId">The moment ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    Task<int?> GetProjectIdForMomentAsync(int momentId, CancellationToken cancellationToken = default);

    /// <summary>Move unfinished moments from a completed stride to the next active stride.</summary>
    /// <param name="strideId">The stride that was completed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task MoveUnfinishedMomentsToNextStrideAsync(int strideId, CancellationToken cancellationToken = default);

    /// <summary>Calculate burndown chart data points for an iteration.</summary>
    /// <param name="iterationId">The iteration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Burndown data points ordered by date.</returns>
    Task<List<BurndownPointDto>> GetIterationBurndownAsync(int iterationId, CancellationToken cancellationToken = default);
}
