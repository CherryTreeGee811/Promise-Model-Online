using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using PromiseModelOnline.Auth.Models;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("api/users")]
public class RegisterController : ControllerBase
{
    private readonly IConfiguration _config;
    
    private readonly UserManager<IdentityUser> _userManager;

    public RegisterController(IConfiguration config, UserManager<IdentityUser> userManager)
    {
        _config = config;
        _userManager = userManager;
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        // Require a registration key for automated provisioning
        var requiredKey = _config["Auth:RegistrationKey"];
        var provided = Request.Headers["X-Registration-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(requiredKey) && !string.Equals(requiredKey, provided, StringComparison.Ordinal))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(req?.UserName) || string.IsNullOrWhiteSpace(req?.Email) || string.IsNullOrWhiteSpace(req?.Password))
        {
            return BadRequest("UserName, Email and Password are required.");
        }

        var existingName = await _userManager.FindByNameAsync(req.UserName);
        if (existingName != null)
        {
            return Conflict(new { message = "The username provided Is already taken" });
        }

        var existingEmail = await _userManager.FindByEmailAsync(req.Email);
        if (existingEmail != null)
        {
            return Conflict(new { message = "The email provided is already associated with an existing account" });
        }

        var user = new IdentityUser
        {
            UserName = req.UserName,
            Email = req.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(';', result.Errors.Select(e => e.Description));
            return BadRequest(new { message = "Could not create user", errors });
        }

        var resp = new RegisterResponse { Created = true, UserName = user.UserName, Email = user.Email };
        return Created(string.Empty, resp);
    }
}
