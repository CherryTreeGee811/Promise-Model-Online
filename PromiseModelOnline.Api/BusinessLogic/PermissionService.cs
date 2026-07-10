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

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Permission"/> entities with invitation and authorization flows.</summary>
/// <remarks>
///   Handles project member invitations (with owner authorization), acceptance flows, permission
///   removal, and access-level lookups. Sends invitation notifications. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with required dependencies.</remarks>
public class PermissionService(
    IPermissionRepository permissionRepo,
    IUserRepository userRepo,
    IGenericRepository<Project> projectRepo,
    IGenericMapper<Permission, PermissionDto> mapper,
    INotificationService notificationService) : IPermissionService
{
    private readonly IPermissionRepository _permissionRepo = permissionRepo;
    private readonly IUserRepository _userRepo = userRepo;
    private readonly IGenericRepository<Project> _projectRepo = projectRepo;
    private readonly IGenericMapper<Permission, PermissionDto> _mapper = mapper;
    private readonly INotificationService _notificationService = notificationService;

    /// <summary>Return all permission records for a project as DTOs.</summary>
    /// <param name="projectId">The project ID.</param>
    /// <returns>Permission DTOs with user and role information.</returns>
    public async Task<IEnumerable<PermissionDto>> GetPermissionsByProjectAsync(int projectId)
    {
        var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId);
        return permissions.Select(p => _mapper.Map(p, null!));
    }

    /// <summary>Invite a user to a project with owner authorization.</summary>
    /// <param name="projectId">The project ID (resolved by the controller from route slugs).</param>
    /// <param name="email">Email address of the user to invite.</param>
    /// <param name="level">Access level to grant.</param>
    /// <param name="ownerUserId">The requesting user ID for owner authorization.</param>
    /// <returns>The created permission DTO.</returns>
    /// <exception cref="InvalidOperationException">Project not found, user not found, or already has permission.</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not the project owner.</exception>
    public async Task<PermissionDto> InviteUserAsync(int projectId, string email, PermissionLevel level, int ownerUserId)
    {
        var project = await _projectRepo.GetByIdAsync(projectId)
                      ?? throw new InvalidOperationException("Project not found");

        if (project.OwnerId != ownerUserId)
            throw new UnauthorizedAccessException("Only the project owner can invite users.");

        var invitedUser = await FindInvitedUserAsync(email)
                          ?? throw new InvalidOperationException($"User '{email}' not found. Please use their registered email address.");

        var existing = await _permissionRepo.GetByUserAndProjectAsync(invitedUser.Id, project.Id);
        if (existing != null)
            throw new InvalidOperationException("User already has a permission for this project.");

        var permission = new Permission
        {
            UserId = invitedUser.Id,
            ProjectId = project.Id,
            Level = level,
            Status = PermissionStatus.Pending
        };

        await _permissionRepo.AddAsync(permission);
        await _permissionRepo.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(
            invitedUser.Id,
            NotificationType.Invitation,
            $"You have been invited to project '{project.Name}' with {level} access.",
            "/invitations"
        );

        return new PermissionDto
        {
            Id = permission.Id,
            UserId = invitedUser.Id,
            UserName = invitedUser.Name,
            ProjectId = project.Id,
            Level = permission.Level.ToString(),
            Status = permission.Status.ToString()
        };
    }

    /// <summary>Accept a pending invitation on behalf of the user.</summary>
    /// <param name="permissionId">The permission/invitation ID.</param>
    /// <param name="userId">The invited user's ID for authorization.</param>
    /// <returns>The updated permission DTO.</returns>
    /// <exception cref="InvalidOperationException">Permission not found or already accepted.</exception>
    /// <exception cref="UnauthorizedAccessException">Not the user's invitation.</exception>
    public async Task<PermissionDto> AcceptInvitationAsync(int permissionId, int userId)
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

    /// <summary>Return all pending invitations for a user as DTOs.</summary>
    /// <param name="userId">The user ID.</param>
    /// <returns>Pending invitation DTOs.</returns>
    public async Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsForUserAsync(int userId)
    {
        var permissions = await _permissionRepo.GetPendingInvitationsForUserAsync(userId);
        return permissions.Select(p => new PendingInvitationDto
        {
            PermissionId = p.Id,
            ProjectId = p.ProjectId,
            ProjectName = p.Project?.Name ?? "Unknown",
            Level = p.Level.ToString(),
            Status = p.Status.ToString()
        });
    }

    /// <summary>Remove a user's permission from a project (owner only).</summary>
    /// <param name="permissionId">The permission ID to remove.</param>
    /// <param name="requestingUserId">The requesting user ID for owner authorization.</param>
    /// <exception cref="InvalidOperationException">Permission not found.</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not the project owner.</exception>
    public async Task RemovePermissionAsync(int permissionId, int requestingUserId)
    {
        var permission = await _permissionRepo.GetByIdAsync(permissionId)
                         ?? throw new InvalidOperationException("Permission not found");

        var project = await _projectRepo.GetByIdAsync(permission.ProjectId);
        if (project == null || project.OwnerId != requestingUserId)
            throw new UnauthorizedAccessException("Only the project owner can remove permissions.");

        await _permissionRepo.DeleteByIdAsync(permissionId);
    }

    /// <summary>Get a user's effective permission level on a project.</summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="projectId">The project ID.</param>
    /// <returns>The permission level, or <c>null</c> if no access. Project owners always have <see cref="PermissionLevel.Edit"/>.</returns>
    public async Task<PermissionLevel?> GetUserPermissionAsync(int userId, int projectId)
    {
        var project = await _projectRepo.GetByIdAsync(projectId);
        if (project is not null && project.OwnerId == userId)
            return PermissionLevel.Edit;

        var perm = await _permissionRepo.GetByUserAndProjectAsync(userId, projectId);
        if (perm is not null && perm.Status == PermissionStatus.Active)
            return perm.Level;

        return null;
    }

    /// <summary>Find a user by email, display name, or slug for invitation resolution.</summary>
    /// <param name="emailOrName">The email address, display name, or username slug to search for.</param>
    /// <returns>The matching user, or <c>null</c> if not found.</returns>
    private async Task<User?> FindInvitedUserAsync(string emailOrName)
    {
        var users = await _userRepo.FindByEmailAsync(emailOrName);
        var user = users.FirstOrDefault();
        if (user != null) return user;

        var nameMatches = await _userRepo.GetUsersByNameAsync(emailOrName);
        user = nameMatches.FirstOrDefault();
        if (user != null) return user;

        var slugUser = await _userRepo.GetBySlugAsync(emailOrName);
        if (slugUser != null) return slugUser;

        return null;
    }
}
