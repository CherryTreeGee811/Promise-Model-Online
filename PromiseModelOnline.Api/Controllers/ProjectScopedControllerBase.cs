using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>Base controller for endpoints that operate within a project context resolved by owner and project slugs.</summary>
    /// <remarks>
    ///   Provides <see cref="ResolveProjectAsync"/> to look up the project from the URL's
    ///   <c>ownerSlug</c> and <c>projectSlug</c> route parameters. Returns <c>404</c> if
    ///   the project is not found.
    /// </remarks>
    public abstract class ProjectScopedControllerBase : ControllerBase
    {
        /// <param name="projectService">The project service.</param>
        /// <summary>Service for project lookups by slug.</summary>
        protected readonly IProjectService _projectService;

        /// <summary>Initializes the controller with the project service.</summary>
        protected ProjectScopedControllerBase(IProjectService projectService)
        {
            _projectService = projectService;
        }

        /// <summary>Resolve a project from owner slug and project slug route parameters.</summary>
        /// <param name="ownerSlug">The project owner's URL-safe slug.</param>
        /// <param name="projectSlug">The project's URL-safe slug.</param>
        /// <returns>The matching <see cref="Project"/>, or <c>null</c> if not found.</returns>
        protected async Task<Project?> ResolveProjectAsync(string ownerSlug, string projectSlug)
        {
            return await _projectService.GetByOwnerAndSlugAsync(ownerSlug, projectSlug);
        }
    }
}
