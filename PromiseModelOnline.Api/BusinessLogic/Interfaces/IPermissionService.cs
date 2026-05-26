using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IPermissionService
    {
        Task<IEnumerable<PermissionDTO>> GetPermissionsByProjectAsync(int projectId);
        Task<PermissionDTO> InviteUserAsync(CreatePermissionRequestDTO request, int ownerUserId);
        Task<PermissionDTO> AcceptInvitationAsync(int permissionId, int userId);
        Task<IEnumerable<PendingInvitationDTO>> GetPendingInvitationsForUserAsync(int userId);
        Task RemovePermissionAsync(int permissionId, int requestingUserId);
        Task<PermissionLevel?> GetUserPermissionAsync(int userId, int projectId);
    }
}