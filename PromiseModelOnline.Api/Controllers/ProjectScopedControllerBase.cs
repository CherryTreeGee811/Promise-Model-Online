using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    public abstract class ProjectScopedControllerBase : ControllerBase
    {
        protected readonly IProjectService _projectService;

        protected ProjectScopedControllerBase(IProjectService projectService)
        {
            _projectService = projectService;
        }

        protected async Task<Project?> ResolveProjectAsync(string ownerSlug, string projectSlug)
        {
            return await _projectService.GetByOwnerAndSlugAsync(ownerSlug, projectSlug);
        }
    }
}
