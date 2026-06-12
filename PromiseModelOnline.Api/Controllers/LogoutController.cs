using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/sessions/current")]
    [ApiController]
    public class LogoutController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public LogoutController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            var authorizationHeader = Request.Headers["Authorization"].ToString() ?? string.Empty;

            try
            {
                await _authClient.LogoutAsync(
                    new LogoutRequest { RefreshToken = refreshToken },
                    authorizationHeader
                );

                Response.Cookies.Delete("refreshToken");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
