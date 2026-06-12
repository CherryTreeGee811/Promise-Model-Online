using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Api.Tests.Infrastructure;

public static class ControllerTestHelpers
{
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
