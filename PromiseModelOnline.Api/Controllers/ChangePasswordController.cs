using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/users/me")]
    [ApiController]
    [Authorize]
    public class ChangePasswordController : ControllerBase
    {
        private readonly IAuthClient _authClient;
        private readonly ILogger<ChangePasswordController> _logger;

        public ChangePasswordController(IAuthClient authClient, ILogger<ChangePasswordController> logger)
        {
            _authClient = authClient;
            _logger = logger;
        }

        [HttpPatch]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var authorizationHeader = Request.Headers["Authorization"].ToString();
                await _authClient.ChangePasswordAsync(request, authorizationHeader);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated password at {UtcTimestamp}",
                    jwtSub,
                    DateTime.UtcNow);

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
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
