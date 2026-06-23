using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>API endpoint for authenticated users to delete their account.</summary>
/// <remarks>Initializes the controller with Identity, token management, and logging dependencies.</remarks>
/// <param name="userManager">The Identity user manager for password verification and account deletion.</param>
/// <param name="tokenManager">The OpenIddict token manager for revoking all user tokens on deletion.</param>
/// <param name="logger">The logger for account deletion audit events.</param>
[ApiController]
[Route("account/me")]
public class DeleteAccountController(UserManager<IdentityUser> userManager,
                               IOpenIddictTokenManager tokenManager,
                               ILogger<DeleteAccountController> logger) : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly IOpenIddictTokenManager _tokenManager = tokenManager;
    private readonly ILogger<DeleteAccountController> _logger = logger;

    /// <summary>Validate password, revoke all tokens, and delete the user account.</summary>
    /// <param name="request">The delete request containing the user's password for verification.</param>
    /// <response code="204">Account deleted successfully.</response>
    /// <response code="400">Password is missing or account deletion failed.</response>
    /// <response code="401">User is not authenticated or password is invalid.</response>
    /// <returns>NoContent on success, or error response.</returns>
    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest? request)
    {
        if (request == null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        var userId = User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
                     ?? _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("DeleteAccount: user not found for Subject {UserId}", userId);
            return Unauthorized();
        }

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid)
        {
            _logger.LogWarning("DeleteAccount: invalid password for user {UserId}", userId);
            return Unauthorized("Invalid password");
        }

        await foreach (var token in _tokenManager.FindBySubjectAsync(user.Id))
            await _tokenManager.TryRevokeAsync(token);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            _logger.LogError("DeleteAccount: deletion failed for user {UserId}: {Errors}", userId, errors);
            return BadRequest(new { message = "Could not delete account", errors });
        }

        _logger.LogInformation("DeleteAccount: user {UserId} deleted successfully", userId);
        return NoContent();
    }
}
