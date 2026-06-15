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
    /// <summary>REST controller for managing the current user's project permissions and invitations.</summary>
    /// <remarks>
    ///   Provides endpoints for viewing pending invitations and accepting them.
    ///   Requires <c>projects.read</c> for read operations and <c>projects.write</c> for accepting.
    /// </remarks>
    [ApiController]
    [Route("api/permissions")]
    public class MyPermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<MyPermissionsController> _logger;

        public MyPermissionsController(
            IPermissionService permissionService,
            IUserRepository userRepository,
            ILogger<MyPermissionsController> logger)
        {
            _permissionService = permissionService;
            _userRepository = userRepository;
            _logger = logger;
        }

        /// <summary>Get all pending project invitations for the current user.</summary>
        [Authorize(Policy = "projects.read")]
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<PendingInvitationDTO>>> GetPendingInvitations()
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            var invitations = await _permissionService.GetPendingInvitationsForUserAsync(userId.Value);
            return Ok(invitations);
        }

        /// <summary>Accept a pending project invitation.</summary>
        /// <param name="id">The permission/invitation ID.</param>
        /// <param name="request">The update payload.</param>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult<PermissionDTO>> UpdatePermissionStatus(
            int id,
            [FromBody] UpdatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var acceptedPermission = await _permissionService.AcceptInvitationAsync(id, userId.Value);
                return Ok(acceptedPermission);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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
