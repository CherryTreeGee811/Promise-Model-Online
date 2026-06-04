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
        var feature = HttpContext.Features.Get<OpenIddictServerAspNetCoreFeature>();
        var request = feature?.Transaction?.Request;

        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

        var postLogoutUri = request?.PostLogoutRedirectUri;
        if (!string.IsNullOrEmpty(postLogoutUri))
            return Redirect(postLogoutUri);

        return Redirect("/");
    }
}
