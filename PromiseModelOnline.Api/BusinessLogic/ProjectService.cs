using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Project"/> entities with access control and slug generation.</summary>
/// <remarks>
///   Composes <see cref="IProjectRepository"/>, <see cref="IPermissionRepository"/>, and
///   <see cref="IUserRepository"/> to implement project access discovery, member enumeration,
///   promise tree traversal, and unique slug generation. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes a new instance of the <see cref="ProjectService"/> class.</remarks>
/// <param name="projectRepo">The project repository.</param>
/// <param name="permissionRepo">The permission repository.</param>
/// <param name="userRepo">The user repository.</param>
public class ProjectService(
    IProjectRepository projectRepo,
    IPermissionRepository permissionRepo,
    IUserRepository userRepo) : GenericService<Project>(projectRepo), IProjectService
{
    private static readonly Regex SlugInvalidChars = new(
        @"[^a-z0-9\s-]",
        RegexOptions.None,
        TimeSpan.FromMilliseconds(500));

    private readonly IProjectRepository _projectRepo = projectRepo;
    private readonly IPermissionRepository _permissionRepo = permissionRepo;
    private readonly IUserRepository _userRepo = userRepo;

    /// <summary>Return projects accessible to a user (owned or shared).</summary>
    /// <remarks>
    ///   Unions owned projects with projects where the user has any permission record.
    ///   Eagerly loads the project owner's user data for each result.
    /// </remarks>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All projects the user can access, deduplicated.</returns>
    public async Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var ownedProjects = await _projectRepo.GetProjectsOwnedByUserAsync(userId, cancellationToken);

        var sharedProjectIds = await _permissionRepo.GetProjectIdsForUserAsync(userId, cancellationToken);
        var sharedProjects = sharedProjectIds.Any()
            ? await _projectRepo.GetProjectsByIdsAsync(sharedProjectIds, cancellationToken)
            : Enumerable.Empty<Project>();

        return ownedProjects.Concat(sharedProjects).DistinctBy(p => p.Id).ToList();
    }

    /// <summary>Return the member list for a project (owner + active permission users).</summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Project member DTOs with user name and email.</returns>
    /// <exception cref="InvalidOperationException">Project not found.</exception>
    public async Task<IEnumerable<ProjectMemberDto>> GetProjectMembersAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepo.GetByIdAsync(projectId, cancellationToken);
        if (project is null)
            throw new InvalidOperationException("Project not found");

        var members = new List<ProjectMemberDto>();

        var owner = await _userRepo.GetByIdAsync(project.OwnerId, cancellationToken);
        if (owner is not null)
            members.Add(new ProjectMemberDto
            {
                UserId = owner.Id,
                UserName = owner.Name,
                Email = owner.Email
            });

        var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId, cancellationToken);
        members.AddRange(permissions
            .Where(p => p.Status == PermissionStatus.Active
                        && members.All(m => m.UserId != p.UserId)
                        && p.User is not null)
            .Select(p => new ProjectMemberDto
            {
                UserId = p.User!.Id,
                UserName = p.User.Name,
                Email = p.User.Email
            }));

        return members;
    }

    /// <summary>Return the top-level product promises for a project.</summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All top-level promises, ordered by display order.</returns>
    public async Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId, CancellationToken cancellationToken = default)
        => await _projectRepo.GetProductPromisesByProjectAsync(projectId, cancellationToken);

    /// <summary>Look up a project by owner slug and project slug.</summary>
    /// <param name="ownerSlug">The owner's URL-safe slug.</param>
    /// <param name="projectSlug">The project's URL-safe slug.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matching project, or <c>null</c>.</returns>
    public async Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug, CancellationToken cancellationToken = default)
        => await _projectRepo.GetByOwnerAndSlugAsync(ownerSlug, projectSlug, cancellationToken);

    /// <summary>Generate a unique URL-safe slug for a project within the owner's namespace.</summary>
    /// <remarks>
    ///   Normalizes the name (lowercase, removes special chars, replaces spaces with hyphens)
    ///   and appends a numeric suffix if the slug already exists for this owner.
    /// </remarks>
    /// <param name="name">The project name to base the slug on.</param>
    /// <param name="ownerId">The owner's user ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A unique slug string.</returns>
    public async Task<string> GenerateProjectSlugAsync(string name, int ownerId, CancellationToken cancellationToken = default)
    {
        var baseSlug = SlugInvalidChars.Replace(name.ToLowerInvariant(), "")
            .Replace(" ", "-")
            .Replace("--", "-")
            .Trim('-');

        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = "project";

        var slug = baseSlug;
        var suffix = 1;
        while (true)
        {
            var existing = await _projectRepo.GetByOwnerAndSlugAsync(
                (await _userRepo.GetByIdAsync(ownerId, cancellationToken))?.Slug ?? "", slug, cancellationToken);
            if (existing is null)
                return slug;

            suffix++;
            slug = $"{baseSlug}-{suffix}";
        }
    }


}
