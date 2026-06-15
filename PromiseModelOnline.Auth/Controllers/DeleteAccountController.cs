using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>API endpoint for authenticated users to delete their account.</summary>
[ApiController]
[Route("account/me")]
public class DeleteAccountController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;

    public DeleteAccountController(UserManager<IdentityUser> userManager,
                                   IOpenIddictTokenManager tokenManager)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
    }

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
        if (request == null || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        var userId = User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
                     ?? _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Unauthorized();

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid)
            return Unauthorized("Invalid password");

        await foreach (var token in _tokenManager.FindBySubjectAsync(user.Id))
            await _tokenManager.TryRevokeAsync(token);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            return BadRequest(new { message = "Could not delete account", errors });
        }

        return NoContent();
    }
}
