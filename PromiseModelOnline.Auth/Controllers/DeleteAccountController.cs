using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
<<<<<<< HEAD
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.Controllers;

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

    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest? request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        var userId = User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
                     ?? _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
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
||||||| 1bedf4f
=======
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Models;
using System.IdentityModel.Tokens.Jwt;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("api/users/me")]
public class DeleteAccountController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly AuthorizationDbContext _dbContext;

    public DeleteAccountController(UserManager<IdentityUser> userManager, AuthorizationDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
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

        var activeTokens = await _dbContext.RefreshTokens
            .Where(r => r.UserId == user.Id && !r.IsRevoked && r.Expires > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _dbContext.SaveChangesAsync();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            return BadRequest(new { message = "Could not delete account", errors });
        }

        return NoContent();
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
