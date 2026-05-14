using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Security;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("auth")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly IAuthClient _authClient;
        private readonly IUserRepository _userRepository;

        public RegisterController(IAuthClient authClient,
                                  IUserRepository userRepository)
        {
            _authClient = authClient;
            _userRepository = userRepository;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var resp = await _authClient.RegisterAsync(request);
                if (resp == null)
                    return Conflict("User already exists");

                // Create/update the local user record with the real username
                await _userRepository.GetOrCreateUserByEmailAsync(request.Email, request.UserName);

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
            catch (System.Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}