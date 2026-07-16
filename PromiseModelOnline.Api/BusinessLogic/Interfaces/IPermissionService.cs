using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for Permission business logic with invitation and access management.</summary>
/// <remarks>
///   Handles project member invitations, accept/decline flows, permission removal, and
///   authorization lookups. Scoped lifetime.
/// </remarks>
public interface IPermissionService
{
    /// <summary>Return all permission records for a project.</summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Permission DTOs with user and role information.</returns>
    Task<IEnumerable<PermissionDto>> GetPermissionsByProjectAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>Invite a user to a project.</summary>
    /// <param name="projectId">The project ID (resolved by the controller from route slugs).</param>
    /// <param name="email">Email address of the user to invite.</param>
    /// <param name="level">Access level to grant.</param>
    /// <param name="ownerUserId">The requesting user ID for authorization.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created permission DTO.</returns>
    Task<PermissionDto> InviteUserAsync(int projectId, string email, PermissionLevel level, int ownerUserId, CancellationToken cancellationToken = default);

    /// <summary>Accept a pending invitation.</summary>
    /// <param name="permissionId">The permission/invitation ID.</param>
    /// <param name="userId">The invited user's ID for authorization.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated permission DTO.</returns>
    Task<PermissionDto> AcceptInvitationAsync(int permissionId, int userId, CancellationToken cancellationToken = default);

    /// <summary>Return all pending invitations for a user.</summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Pending invitation DTOs.</returns>
    Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsForUserAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Remove a user's permission from a project.</summary>
    /// <param name="permissionId">The permission ID to remove.</param>
    /// <param name="requestingUserId">The requesting user ID for authorization.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task RemovePermissionAsync(int permissionId, int requestingUserId, CancellationToken cancellationToken = default);

    /// <summary>Get a user's permission level on a project.</summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The permission level, or <c>null</c> if no access.</returns>
    Task<PermissionLevel?> GetUserPermissionAsync(int userId, int projectId, CancellationToken cancellationToken = default);
}
