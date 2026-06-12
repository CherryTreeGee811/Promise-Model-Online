using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Controllers;

[ApiController]
[Route("connect/logout")]
public class LogoutController : ControllerBase
{
    [HttpGet, HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

        // Let OpenIddict handle the end_session response, which validates
        // post_logout_redirect_uri against registered URIs before redirecting.
        return SignOut(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }
}
