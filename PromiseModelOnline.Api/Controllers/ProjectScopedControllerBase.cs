using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>Base controller for endpoints that operate within a project context resolved by owner and project slugs.</summary>
/// <remarks>
///   Provides <see cref="ResolveProjectAsync"/> to look up the project from the URL's
///   <c>ownerSlug</c> and <c>projectSlug</c> route parameters. Returns <c>404</c> if
///   the project is not found.
/// </remarks>
/// <remarks>Initializes the controller with the project service.</remarks>
/// <param name="projectService">The project service for slug-based lookups.</param>
[IgnoreAntiforgeryToken]
public abstract class ProjectScopedControllerBase(IProjectService projectService) : ControllerBase
{
    /// <summary>Service for project lookups by slug.</summary>
    protected readonly IProjectService _projectService = projectService;

    /// <summary>Resolve a project from owner slug and project slug route parameters.</summary>
    /// <param name="ownerSlug">The project owner's URL-safe slug.</param>
    /// <param name="projectSlug">The project's URL-safe slug.</param>
    /// <returns>The matching <see cref="Project"/>, or <c>null</c> if not found.</returns>
    protected async Task<Project?> ResolveProjectAsync(string ownerSlug, string projectSlug) => await _projectService.GetByOwnerAndSlugAsync(ownerSlug, projectSlug);

    /// <summary>Check the current user has Edit permission on the given project and return Forbid() if not.</summary>
    protected async Task<bool> RequireProjectEditPermissionAsync(Project project)
    {
        var permissionService = HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var userRepository = HttpContext.RequestServices.GetRequiredService<DAL.Interfaces.IUserRepository>();

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrEmpty(email)) return false;

        var username = User.FindFirst("nameid")?.Value;
        var user = await userRepository.GetOrCreateUserByEmailAsync(email, username);

        var level = await permissionService.GetUserPermissionAsync(user.Id, project.Id);
        return level == PermissionLevel.Edit;
    }
}
