using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/access-tokens")]
    [ApiController]
    public class RefreshController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public RefreshController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            try
            {
                var tokenResponse = await _authClient.RefreshAsync(request);
                return Ok(tokenResponse);
            }
            catch (ArgumentException)
            {
                return BadRequest("Bad request");
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Invalid or expired refresh token");
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
