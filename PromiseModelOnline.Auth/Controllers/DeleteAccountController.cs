using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;
using System.IdentityModel.Tokens.Jwt;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("api/users/me")]
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

    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest? request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
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

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid)
        {
            return Unauthorized("Invalid password");
        }

        // Revoke all tokens for this user
        await foreach (var token in _tokenManager.FindBySubjectAsync(user.Id))
        {
            await _tokenManager.TryRevokeAsync(token);
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            return BadRequest(new { message = "Could not delete account", errors });
        }

        return NoContent();
    }
}