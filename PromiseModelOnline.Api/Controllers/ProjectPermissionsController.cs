using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner}/{project}/permissions")]
    public class ProjectPermissionsController : ProjectScopedControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IPermissionRepository _permissionRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ProjectPermissionsController> _logger;

        public ProjectPermissionsController(
            IPermissionService permissionService,
            IPermissionRepository permissionRepository,
            IUserRepository userRepository,
            ILogger<ProjectPermissionsController> logger,
            IProjectService projectService)
            : base(projectService)
        {
            _permissionService = permissionService;
            _permissionRepository = permissionRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDTO>>> GetPermissions(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var permissions = await _permissionService.GetPermissionsByProjectAsync(projectEntity.Id);
            return Ok(permissions);
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<PermissionDTO>> InviteUser([FromBody] CreatePermissionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            request.ProjectId = projectEntity.Id;

            try
            {
                var result = await _permissionService.InviteUserAsync(request, userId.Value);

                _logger.LogInformation(
                    "User {UserId} created Permission invitation {PermissionId} at {UtcTimestamp}: {Details}",
                    userId.Value,
                    result.Id,
                    DateTime.UtcNow,
                    new { request.ProjectId, request.UserEmail, request.Level });

                return CreatedAtAction(nameof(GetPermissions), new { owner, project }, result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.write")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokePermission(int id, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                await _permissionService.RemovePermissionAsync(id, userId.Value);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int id, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            // The {id} parameter is actually the projectId in the original route
            // but in this project-scoped version we use the resolved project
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);
            var permissionLevel = await _permissionService.GetUserPermissionAsync(user.Id, projectEntity.Id);

            if (permissionLevel == null)
                return NoContent();

            return Ok(permissionLevel.ToString());
        }

        private async Task<int?> GetCurrentUserIdByEmailAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value
                     ?? User.FindFirst("emails")?.Value;

            if (string.IsNullOrEmpty(email))
                return null;

            var username = User.FindFirst("nameid")?.Value;
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
            return user.Id;
        }
    }
}
