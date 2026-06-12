using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DTOs;

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

        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> Login([FromBody] UserLogin userLogin)
        {
            try
            {
                var tokenResponse = await _authClient.LoginAsync(userLogin);

                if (tokenResponse == null ||
                    string.IsNullOrEmpty(tokenResponse.AccessToken) ||
                    string.IsNullOrEmpty(tokenResponse.RefreshToken))
                {
                    return StatusCode(500, "Invalid token response");
                }

                Response.Cookies.Append("refreshToken", tokenResponse.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(30)
                });

                return Ok(new AccessTokenResponse
                {
                    AccessToken = tokenResponse.AccessToken
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Invalid username or password");
            }
            catch
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}