using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;
using System.IdentityModel.Tokens.Jwt;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("api/users/me")]
public class ChangePasswordController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;

    public ChangePasswordController(UserManager<IdentityUser> userManager,
                                    IOpenIddictTokenManager tokenManager)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
    }

    [HttpPatch]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest? request)
    {
        if (request == null
            || string.IsNullOrWhiteSpace(request.CurrentPassword)
            || string.IsNullOrWhiteSpace(request.NewPassword)
            || string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return BadRequest("CurrentPassword, NewPassword and ConfirmPassword are required.");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return BadRequest("New password and confirmation password must match.");
        }

        var userName = User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value;
        if (string.IsNullOrEmpty(userName))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByNameAsync(userName);
        if (user == null)
        {
            return Unauthorized();
        }

        var isValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!isValid)
        {
            return Unauthorized("Invalid password");
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            return BadRequest(new { message = "Could not change password", errors });
        }

        // Revoke all existing refresh tokens for this user
        await foreach (var token in _tokenManager.FindBySubjectAsync(user.Id))
        {
            await _tokenManager.TryRevokeAsync(token);
        }

        return NoContent();
    }
}