using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/sessions")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public LoginController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] UserLogin userLogin)
        {
            try
            {
                var tokenResponse = await _authClient.LoginAsync(userLogin);
                return Ok(tokenResponse);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Invalid username or password");
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}