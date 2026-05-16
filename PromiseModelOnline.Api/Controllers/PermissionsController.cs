using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<PermissionsController> _logger;

        public PermissionsController(IPermissionService permissionService,
                                     IUserRepository userRepository,
                                     ILogger<PermissionsController> logger)
        {
            _permissionService = permissionService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDTO>>> GetPermissions(
            [FromQuery] int projectId)
        {
            var permissions = await _permissionService.GetPermissionsByProjectAsync(projectId);
            return Ok(permissions);
        }

        [HttpPost]
        public async Task<ActionResult<PermissionDTO>> InviteUser(
            [FromBody] CreatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _permissionService.InviteUserAsync(request, userId.Value);

                _logger.LogInformation(
                    "User {UserId} created Permission invitation {PermissionId} at {UtcTimestamp}: {Details}",
                    userId.Value,
                    result.Id,
                    DateTime.UtcNow,
                    new { request.ProjectId, request.UserEmail, request.Level });

                return CreatedAtAction(nameof(GetPermissions), new { projectId = request.ProjectId }, result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokePermission(int id)
        {
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

        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<PendingInvitationDTO>>> GetPendingInvitations()
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            var invitations = await _permissionService.GetPendingInvitationsForUserAsync(userId.Value);
            return Ok(invitations);
        }

        /// <summary>
        /// Returns the current user's permission level for the given project, or 204 if none.
        /// </summary>
        [HttpGet("{id}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int id)
        {
            try
            {
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized();

                var user = await _userRepository.GetOrCreateUserByEmailAsync(userEmail);

                var permissionLevel = await _permissionService.GetUserPermissionAsync(user.Id, id);

                if (permissionLevel == null)
                    return NoContent();

                return Ok(permissionLevel.ToString());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<int?> GetCurrentUserIdByEmailAsync()
        {
            // Try common claim types for email
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value
                     ?? User.FindFirst("emails")?.Value;

            if (string.IsNullOrEmpty(email))
                return null;

            // Extract username for consistent display name
            var username = User.FindFirst("nameid")?.Value;

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
            return user.Id;
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<PermissionDTO>> UpdatePermissionStatus(
            int id,
            [FromBody] UpdatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                // ✅ IMPORTANT: capture result
                var acceptedPermission = await _permissionService.AcceptInvitationAsync(id, userId.Value);

                // ✅ RETURN Ok(...) NOT NoContent
                return Ok(acceptedPermission);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}