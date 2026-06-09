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

    [Authorize(Policy = "projects.read")]
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<object>>> SearchUsers([FromQuery] string q, [FromQuery] int max = 10)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        var users = await _userRepository.SearchUsersAsync(q, max);
        return Ok(users.Select(u => new
        {
            u.Id,
            u.Name,
            u.Email
        }));
    }
}