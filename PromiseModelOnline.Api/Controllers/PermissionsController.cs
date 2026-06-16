using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for permission and invitation management.</summary>
    /// <remarks>
    ///   Route is disabled — use project-scoped controllers. Provides invite, revoke, and
    ///   permission-level lookups. Requires <c>projects.write</c> for mutations.
    /// </remarks>
    [Route("__disabled__/{controller}")]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<PermissionsController> _logger;

        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="permissionService">The service for permission business logic.</param>
        /// <param name="userRepository">The repository for user data access.</param>
        public PermissionsController(IPermissionService permissionService,
                                     IUserRepository userRepository,
                                     ILogger<PermissionsController> logger)
        {
            _permissionService = permissionService;
            _userRepository = userRepository;
            _logger = logger;
        }
        /// <summary>Return all permission records for a project.</summary>
        /// <param name="projectId">The project ID.</param>
        /// <returns>A list of permission DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDTO>>> GetPermissions([FromQuery] int projectId)
        {
            var permissions = await _permissionService.GetPermissionsByProjectAsync(projectId);
            return Ok(permissions);
        }

        /// <summary>Invites a user to a project by creating a permission record.</summary>
        /// <param name="request">The invitation request containing email and project ID.</param>
        /// <returns>The created permission DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<PermissionDTO>> InviteUser([FromBody] CreatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _permissionService.InviteUserAsync(request, userId.Value);
                _logger.LogInformation("User {UserId} invited {Email} to project {ProjectId}",
                    userId.Value, request.Email, request.ProjectId);
                return CreatedAtAction(nameof(GetPermissions), new { projectId = request.ProjectId }, result);
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }
        /// <summary>Remove a user's permission from a project.</summary>
        /// <param name="id">The permission ID.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokePermission(int id)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try { await _permissionService.RemovePermissionAsync(id, userId.Value); return NoContent(); }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }

        /// <summary>Return pending invitations for the current user.</summary>
        [Authorize(Policy = "projects.read")]
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<PendingInvitationDTO>>> GetPendingInvitations()
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            var invitations = await _permissionService.GetPendingInvitationsForUserAsync(userId.Value);
            return Ok(invitations);
        }
        /// <summary>Return the current user's permission level for a project.</summary>
        /// <param name="id">The project ID.</param>
        /// <returns>The permission level string.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int id)
        {
            try
            {
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

                var user = await _userRepository.GetOrCreateUserByEmailAsync(userEmail);
                var permissionLevel = await _permissionService.GetUserPermissionAsync(user.Id, id);

                if (permissionLevel == null) return NoContent();
                return Ok(permissionLevel.ToString());
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }
        /// <summary>Accept a pending invitation.</summary>
        /// <param name="id">The permission ID.</param>
        /// <param name="request">The update request.</param>
        /// <returns>The updated permission DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult<PermissionDTO>> UpdatePermissionStatus(int id, [FromBody] UpdatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var acceptedPermission = await _permissionService.AcceptInvitationAsync(id, userId.Value);
                return Ok(acceptedPermission);
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }

        /// <summary>Resolve the current user ID from JWT email claim.</summary>
        private async Task<int?> GetCurrentUserIdByEmailAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value
                     ?? User.FindFirst("emails")?.Value;
            if (string.IsNullOrEmpty(email)) return null;
            var username = User.FindFirst("nameid")?.Value;
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
            return user.Id;
        }
    }
}
