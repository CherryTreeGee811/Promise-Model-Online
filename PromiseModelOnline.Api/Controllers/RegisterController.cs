using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Security;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("auth")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public RegisterController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var resp = await _authClient.RegisterAsync(request);
                if (resp == null)
                {
                    return Conflict("User already exists");
                }

                return Created(string.Empty, resp);
            }
            catch (ArgumentException)
            {
                return BadRequest("Bad request");
            }
            catch (SecurityException)
            {
                return Forbid();
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
