using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Models;
using System.IdentityModel.Tokens.Jwt;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("auth/")]
public class DeleteAccountController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly AuthorizationDbContext _dbContext;

    public DeleteAccountController(UserManager<IdentityUser> userManager, AuthorizationDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    [HttpPost("delete-account")]
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
