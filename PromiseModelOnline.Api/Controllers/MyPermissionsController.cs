using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for managing the current user's project permissions and invitations.</summary>
/// <remarks>
///   Provides endpoints for viewing pending invitations and accepting them.
///   Requires <c>projects.read</c> for read operations and <c>projects.write</c> for accepting.
/// </remarks>
/// <param name="permissionService">The service for permission business logic.</param>
/// <param name="userRepository">The repository for user data access.</param>
[ApiController]
[Route("api/permissions")]
public class MyPermissionsController(
    IPermissionService permissionService,
    IUserRepository userRepository) : ControllerBase
{
    private readonly IPermissionService _permissionService = permissionService;
    private readonly IUserRepository _userRepository = userRepository;

    /// <summary>Get all pending project invitations for the current user.</summary>
    [Authorize(Policy = "projects.read")]
    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<PendingInvitationDto>>> GetPendingInvitations()
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
    public async Task<ActionResult<PermissionDto>> UpdatePermissionStatus(
        int id,
        [FromBody] UpdatePermissionRequestDto request)
    {
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
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
