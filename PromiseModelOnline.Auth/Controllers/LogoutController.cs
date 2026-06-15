using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles OpenID Connect end-session (logout) requests.</summary>
/// <remarks>
///   Signs out the application cookie and delegates the end_session response to OpenIddict
///   so the client receives proper post-logout redirect handling.
/// </remarks>
[ApiController]
[Route("connect/logout")]
public class LogoutController : ControllerBase
{
    /// <summary>Sign out the current user and process the end_session request.</summary>
    [HttpGet, HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return SignOut(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }
}
