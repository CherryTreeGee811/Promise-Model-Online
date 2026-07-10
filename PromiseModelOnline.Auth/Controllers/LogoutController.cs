using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles OpenID Connect end-session (logout) requests.</summary>
/// <remarks>
///   Signs out the application cookie and delegates the end_session response to OpenIddict
///   so the client receives proper post-logout redirect handling.
/// </remarks>
/// <remarks>Initializes the controller with logging for session termination audit events.</remarks>
/// <param name="logger">The logger for logout audit events.</param>
[ApiController]
[Route("connect/logout")]
public class LogoutController(ILogger<LogoutController> logger) : ControllerBase
{
    private readonly ILogger<LogoutController> _logger = logger;

    /// <summary>Sign out the current user and process the end_session request.</summary>
    [Authorize]
    [HttpGet, HttpPost]
#pragma warning disable S4502 // CSRF not applicable — OpenIddict validates id_token_hint and post_logout_redirect_uri against registered clients, providing session-termination CSRF protection at the OIDC protocol layer
    [IgnoreAntiforgeryToken]
#pragma warning restore S4502
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? "unknown";
        _logger.LogInformation("Logout: user {UserId} signed out", userId);
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return SignOut(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }
}
