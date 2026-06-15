using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>Service for <see cref="Permission"/> business logic with invitation and access management.</summary>
    /// <remarks>
    ///   Handles project member invitations, accept/decline flows, permission removal, and
    ///   authorization lookups. Scoped lifetime.
    /// </remarks>
    public interface IPermissionService
    {
        /// <summary>Return all permission records for a project.</summary>
        /// <param name="projectId">The project ID.</param>
        /// <returns>Permission DTOs with user and role information.</returns>
        Task<IEnumerable<PermissionDTO>> GetPermissionsByProjectAsync(int projectId);

        /// <summary>Invite a user to a project.</summary>
        /// <param name="request">The invitation details (project, user, role).</param>
        /// <param name="ownerUserId">The requesting user ID for authorization.</param>
        /// <returns>The created permission DTO.</returns>
        Task<PermissionDTO> InviteUserAsync(CreatePermissionRequestDTO request, int ownerUserId);

        /// <summary>Accept a pending invitation.</summary>
        /// <param name="permissionId">The permission/invitation ID.</param>
        /// <param name="userId">The invited user's ID for authorization.</param>
        /// <returns>The updated permission DTO.</returns>
        Task<PermissionDTO> AcceptInvitationAsync(int permissionId, int userId);

        /// <summary>Return all pending invitations for a user.</summary>
        /// <param name="userId">The user ID.</param>
        /// <returns>Pending invitation DTOs.</returns>
        Task<IEnumerable<PendingInvitationDTO>> GetPendingInvitationsForUserAsync(int userId);

        /// <summary>Remove a user's permission from a project.</summary>
        /// <param name="permissionId">The permission ID to remove.</param>
        /// <param name="requestingUserId">The requesting user ID for authorization.</param>
        Task RemovePermissionAsync(int permissionId, int requestingUserId);

        /// <summary>Get a user's permission level on a project.</summary>
        /// <param name="userId">The user ID.</param>
        /// <param name="projectId">The project ID.</param>
        /// <returns>The permission level, or <c>null</c> if no access.</returns>
        Task<PermissionLevel?> GetUserPermissionAsync(int userId, int projectId);
    }
}
