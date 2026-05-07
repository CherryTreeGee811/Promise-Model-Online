using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("auth")]
    [ApiController]
    [Authorize]
    public class ChangePasswordController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public ChangePasswordController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var authorizationHeader = Request.Headers["Authorization"].ToString();
                await _authClient.ChangePasswordAsync(request, authorizationHeader);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Unauthorized");
            }
            catch (ArgumentException)
            {
                return BadRequest("Bad request");
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
