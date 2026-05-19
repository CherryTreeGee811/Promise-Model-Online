using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("api/sessions/current")]
public class LogoutController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    
    private readonly AuthorizationDbContext _dbContext;

    public LogoutController(UserManager<IdentityUser> userManager, AuthorizationDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    [HttpDelete]
    [Authorize]   // Requires a valid access token in the Authorization header
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request)
    {
        // Extract the user's name from the JWT
        var userName = User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value;
        if (string.IsNullOrEmpty(userName))
            return Unauthorized();

        var user = await _userManager.FindByNameAsync(userName);
        if (user == null)
            return Unauthorized();

        // If a specific refresh token is provided, revoke only that one
        if (request != null && !string.IsNullOrEmpty(request.RefreshToken))
        {
            var tokenEntity = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == request.RefreshToken && r.UserId == user.Id);
            if (tokenEntity != null)
                tokenEntity.IsRevoked = true;
        }
        else
        {
            // Revoke all active refresh tokens for this user
            var activeTokens = await _dbContext.RefreshTokens
                .Where(r => r.UserId == user.Id && !r.IsRevoked && r.Expires > DateTime.UtcNow)
                .ToListAsync();
            foreach (var token in activeTokens)
                token.IsRevoked = true;
        }

        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}