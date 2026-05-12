using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
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

        public PermissionService(
            IPermissionRepository permissionRepo,
            IUserRepository userRepo,
            IGenericRepository<Project> projectRepo,
            IGenericMapper<Permission, PermissionDTO> mapper)
        {
            _permissionRepo = permissionRepo;
            _userRepo = userRepo;
            _projectRepo = projectRepo;
            _mapper = mapper;
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

            // This will either find an existing local user or create one (without credentials)
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

        public async Task RemovePermissionAsync(int permissionId, int requestingUserId)
        {
            var permission = await _permissionRepo.GetByIdAsync(permissionId)
                             ?? throw new InvalidOperationException("Permission not found");

            var project = await _projectRepo.GetByIdAsync(permission.ProjectId);
            if (project == null || project.OwnerId != requestingUserId)
                throw new UnauthorizedAccessException("Only the project owner can remove permissions.");

            await _permissionRepo.DeleteByIdAsync(permissionId);
        }
    }
}