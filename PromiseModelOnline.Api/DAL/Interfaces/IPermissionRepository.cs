using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Permission"/> entities managing project access rights.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with queries for user-project role assignments,
///   pending invitations, and project-access enumeration. Scoped lifetime.
/// </remarks>
public interface IPermissionRepository : IGenericRepository<Permission>
{
    /// <summary>Return all permission records for a project, including user data.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Permission records with associated user information.</returns>
    Task<IEnumerable<Permission>> GetPermissionsByProjectAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>Return all pending (unaccepted) invitations for a user.</summary>
    /// <param name="userId">The invited user's ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Pending invitations with project details.</returns>
    Task<IEnumerable<Permission>> GetPendingInvitationsForUserAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Look up a specific user's permission on a specific project.</summary>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The permission record, or <c>null</c> if the user has no access.</returns>
    Task<Permission?> GetByUserAndProjectAsync(int userId, int projectId, CancellationToken cancellationToken = default);

    /// <summary>Return all project IDs the user has active access to.</summary>
    /// <remarks>
    ///   Only returns projects where the user's permission status is <c>Active</c>.
    /// </remarks>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Distinct project IDs the user can access.</returns>
    Task<IEnumerable<int>> GetProjectIdsForUserAsync(int userId, CancellationToken cancellationToken = default);
}
