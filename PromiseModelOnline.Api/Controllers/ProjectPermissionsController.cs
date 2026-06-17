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

    /// <summary>REST controller for permission management within a project scope.</summary>
    [Route("api/projects/{owner}/{project}/permissions")]

    public class ProjectPermissionsController : ProjectScopedControllerBase

    {

        private readonly IPermissionService _permissionService;

        private readonly IUserRepository _userRepository;

        private readonly ILogger<ProjectPermissionsController> _logger;

        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="permissionService">The service for permission business logic.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="userRepository">The repository for user data access.</param>
        public ProjectPermissionsController(

            IPermissionService permissionService,

            IUserRepository userRepository,

            ILogger<ProjectPermissionsController> logger,

            IProjectService projectService)

            : base(projectService)

        {

            _permissionService = permissionService;

            _userRepository = userRepository;

            _logger = logger;

        }

        /// <summary>Return all permission records for a project.</summary>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>A list of permission DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissions(string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);

            if (projectEntity is null)

                return NotFound();

            var permissions = await _permissionService.GetPermissionsByProjectAsync(projectEntity.Id);

            return Ok(permissions);

        }

        /// <summary>Invite a user to a project.</summary>
        /// <param name="request">The invitation request data.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The created permission DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<PermissionDto>> InviteUser([FromBody] CreatePermissionRequestDto request, string owner, string project)

        {

            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
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

                    new { request.ProjectId, request.Email, request.Level });

                return CreatedAtAction(nameof(GetPermissions), new { owner, project }, result);

            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "InviteUser failed for project {Owner}/{Project}", owner, project);
                return BadRequest("The invitation could not be sent.");
            }

        }

        /// <summary>Remove a user's permission from a project.</summary>
        /// <param name="id">The permission ID to remove.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokePermission(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
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
                _logger.LogError(ex, "RevokePermission failed for permission {Id}", id);
                return BadRequest("The permission could not be revoked.");
            }

        }

        /// <summary>Return the current user's permission level for a project.</summary>
        /// <param name="id">The permission ID.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The permission level string.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);

            if (projectEntity is null)

                return NotFound();

            var email = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrEmpty(email))

                return Unauthorized();

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);

            var permissionLevel = await _permissionService.GetUserPermissionAsync(user.Id, projectEntity.Id);

            if (permissionLevel == null)

                return NoContent();

            return Ok(permissionLevel.ToString());

        }

        /// <summary>Resolve the current user ID from JWT email claim.</summary>
        /// <returns>The user ID, or <c>null</c> if the email claim is missing.</returns>
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
