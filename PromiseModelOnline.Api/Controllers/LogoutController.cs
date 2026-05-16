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
        public async Task<IActionResult> Logout([FromBody] LogoutRequest? request)
        {
            try
            {
                var authorizationHeader = Request.Headers["Authorization"].ToString();
                await _authClient.LogoutAsync(request, authorizationHeader);
                return NoContent();
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
