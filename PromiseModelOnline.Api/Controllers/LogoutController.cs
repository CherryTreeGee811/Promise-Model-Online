using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("auth")]
    [ApiController]
    public class LogoutController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public LogoutController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            try
            {
                await _authClient.LogoutAsync(request);
                return Ok();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Invalid refresh token");
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
