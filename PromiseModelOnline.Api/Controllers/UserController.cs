using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var id = User.FindFirstValue("sub");

        return Ok(new
        {
            id,
            email
        });
    }
}