using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>API endpoint for authenticated users to change their password and revoke refresh tokens.</summary>
[ApiController]
[Route("account/me/password")]
public class ChangePasswordController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;
    private readonly ILogger<ChangePasswordController> _logger;

    /// <summary>Initializes the controller with required services for password management and token revocation.</summary>
    /// <param name="userManager">Identity user manager for password verification and changes.</param>
    /// <param name="tokenManager">OpenIddict token manager for refresh token revocation.</param>
    /// <param name="logger">Logger for security-relevant error events.</param>
    public ChangePasswordController(UserManager<IdentityUser> userManager,
                                    IOpenIddictTokenManager tokenManager,
                                    ILogger<ChangePasswordController> logger)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
        _logger = logger;
    }

    /// <summary>Validate current password, update to new password, and revoke all refresh tokens.</summary>
    /// <param name="request">The password change request containing current password, new password, and confirmation.</param>
    /// <response code="200">Password changed successfully.</response>
    /// <response code="400">Validation failed (missing fields, mismatch, incorrect current password).</response>
    /// <response code="401">User is not authenticated or not found.</response>
    /// <returns>An Ok result on success, or BadRequest/Unauthorized.</returns>
    [HttpPatch]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest? request)
    {
        if (request == null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(request.CurrentPassword)
            || string.IsNullOrWhiteSpace(request.NewPassword)
            || string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return BadRequest("CurrentPassword, NewPassword and ConfirmPassword are required.");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return BadRequest("New password and confirmation password must match.");
        }

        var userId = User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
                     ?? _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Unauthorized();

        var isValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!isValid)
        {
            _logger.LogWarning("ChangePassword: Invalid current password for user {UserId}", userId);
            return BadRequest("Current password is incorrect.");
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            foreach (var e in result.Errors)
                _logger.LogWarning("ChangePassword failed for user {UserId}: {Error}", userId, e.Description);
            return BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Password change failed.");
        }

        var tokens = _tokenManager.FindAsync(
            subject: user.Id,
            client: null,
            status: null,
            type: OpenIddictConstants.TokenTypeHints.RefreshToken);

        await foreach (var token in tokens)
            await _tokenManager.TryRevokeAsync(token);

        return Ok(new { message = "Password changed successfully." });
    }
}
