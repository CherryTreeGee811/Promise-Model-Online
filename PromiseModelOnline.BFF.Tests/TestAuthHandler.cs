using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>, IAuthenticationSignOutHandler
{
    public const string SchemeName = "cookie";
    public const string AuthenticateHeader = "X-Test-Authenticate";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.ContainsKey(AuthenticateHeader))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim("sub", "test-user-id"),
            new Claim("name", "Test User"),
            new Claim("email", "test@example.com")
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    public Task SignOutAsync(AuthenticationProperties? properties)
    {
        var redirectUri = properties?.RedirectUri ?? "/";
        Response.StatusCode = 302;
        Response.Headers.Location = redirectUri;
        return Task.CompletedTask;
    }
}
