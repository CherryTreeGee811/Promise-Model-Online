using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DTOs;

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
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized();

            try
            {
                var response = await _authClient.RefreshAsync(new RefreshRequest
                {
                    RefreshToken = refreshToken
                });

                if (response == null ||
                    string.IsNullOrEmpty(response.AccessToken) ||
                    string.IsNullOrEmpty(response.RefreshToken))
                {
                    return Unauthorized();
                }

                Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(30)
                });

                return Ok(new AccessTokenResponse
                {
                    AccessToken = response.AccessToken
                });
            }
            catch (UnauthorizedAccessException)
            {
                Response.Cookies.Delete("refreshToken");
                return Unauthorized();
            }
            catch
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
