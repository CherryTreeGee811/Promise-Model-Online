using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Api.Tests.Infrastructure;

/// <summary>Helper methods for setting up controller test fixtures.</summary>
public static class ControllerTestHelpers
{
    /// <summary>Set the <see cref="ControllerBase.User"/> property with test claims for authentication.</summary>
    /// <param name="controller">The controller instance to configure.</param>
    /// <param name="email">The email claim value, or <c>null</c> to omit.</param>
    /// <param name="nameid">The name identifier claim value, or <c>null</c> to omit.</param>
    public static void SetControllerUser(ControllerBase controller, string? email, string? nameid = null)
    {
        var claims = new List<Claim>();
        if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
        if (nameid is not null) claims.Add(new Claim("nameid", nameid));
        var identity = new ClaimsIdentity(claims, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }
}
