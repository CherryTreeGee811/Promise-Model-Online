using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [Authorize(Policy = "projects.read")]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        var id = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name);

        int? userId = null;
        if (!string.IsNullOrEmpty(email))
        {
            var users = await _userRepository.FindByEmailAsync(email);
            var user = users.FirstOrDefault();
            if (user is not null)
                userId = user.Id;
        }

        return Ok(new
        {
            id,
            name,
            email,
            userId
        });
    }
}