using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class PermissionService : IPermissionService
    {
        private readonly IPermissionRepository _permissionRepo;
        private readonly IUserRepository _userRepo;
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly IGenericMapper<Permission, PermissionDTO> _mapper;
        private readonly INotificationService _notificationService;

        public PermissionService(
            IPermissionRepository permissionRepo,
            IUserRepository userRepo,
            IGenericRepository<Project> projectRepo,
            IGenericMapper<Permission, PermissionDTO> mapper,
            INotificationService notificationService)
        {
            _permissionRepo = permissionRepo;
            _userRepo = userRepo;
            _projectRepo = projectRepo;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<PermissionDTO>> GetPermissionsByProjectAsync(int projectId)
        {
            var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId);
            return permissions.Select(p => _mapper.Map(p, null!));
        }

        public async Task<PermissionDTO> InviteUserAsync(CreatePermissionRequestDTO request, int ownerUserId)
        {
            var project = await _projectRepo.GetByIdAsync(request.ProjectId)
                          ?? throw new InvalidOperationException("Project not found");

            if (project.OwnerId != ownerUserId)
                throw new UnauthorizedAccessException("Only the project owner can invite users.");

            var invitedUser = await _userRepo.GetOrCreateUserByEmailAsync(request.UserEmail);

            var existing = await _permissionRepo.GetByUserAndProjectAsync(invitedUser.Id, project.Id);
            if (existing != null)
                throw new InvalidOperationException("User already has a permission for this project.");

            var permission = new Permission
            {
                UserId = invitedUser.Id,
                ProjectId = project.Id,
                Level = request.Level,
                Status = PermissionStatus.Pending
            };

            await _permissionRepo.AddAsync(permission);
            await _permissionRepo.SaveChangesAsync();

            // Send notification to the invited user
            await _notificationService.CreateNotificationAsync(
                invitedUser.Id,
                NotificationType.Invitation,
                $"You have been invited to project '{project.Name}' with {request.Level} access.",
                "/invitations"
            );

            var created = await _permissionRepo.GetByIdAsync(permission.Id);
            return _mapper.Map(created!, null!);
        }

        public async Task<PermissionDTO> AcceptInvitationAsync(int permissionId, int userId)
        {
            var permission = await _permissionRepo.GetByIdAsync(permissionId)
                             ?? throw new InvalidOperationException("Permission not found");

            if (permission.UserId != userId)
                throw new UnauthorizedAccessException("Not your invitation");

            if (permission.Status == PermissionStatus.Active)
                throw new InvalidOperationException("Already accepted");

            permission.Status = PermissionStatus.Active;
            _permissionRepo.Update(permission);
            await _permissionRepo.SaveChangesAsync();

            return _mapper.Map(permission, null!);
        }

        public async Task<IEnumerable<PendingInvitationDTO>> GetPendingInvitationsForUserAsync(int userId)
        {
            var permissions = await _permissionRepo.GetPendingInvitationsForUserAsync(userId);
            return permissions.Select(p => new PendingInvitationDTO
            {
                PermissionId = p.Id,
                ProjectId = p.ProjectId,
                ProjectName = p.Project?.Name ?? "Unknown",
                Level = p.Level.ToString(),
                Status = p.Status.ToString()
            });
        }

        public async Task RemovePermissionAsync(int permissionId, int requestingUserId)
        {
            var permission = await _permissionRepo.GetByIdAsync(permissionId)
                             ?? throw new InvalidOperationException("Permission not found");

            var project = await _projectRepo.GetByIdAsync(permission.ProjectId);
            if (project == null || project.OwnerId != requestingUserId)
                throw new UnauthorizedAccessException("Only the project owner can remove permissions.");

            await _permissionRepo.DeleteByIdAsync(permissionId);
        }

        public async Task<PermissionLevel?> GetUserPermissionAsync(int userId, int projectId)
        {
            // Owners have full access
            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project is not null && project.OwnerId == userId)
                return PermissionLevel.Edit;

            // Check active permission
            var perm = await _permissionRepo.GetByUserAndProjectAsync(userId, projectId);
            if (perm is not null && perm.Status == PermissionStatus.Active)
                return perm.Level;

            return null; // no access]
        }

        public async Task<bool> HasPermissionAsync(int userId, int projectId, PermissionLevel required)
        {
            var level = await GetUserPermissionAsync(userId, projectId);

            if (level == null)
                return false;

            return level >= required;
        }
    }
}