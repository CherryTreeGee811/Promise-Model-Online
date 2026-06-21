using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

/// <summary>Mock authentication handler for BFF test infrastructure.</summary>
/// <remarks>
///   When the <c>X-Test-Authenticate</c> header is present on a request, this handler
///   returns a successfully authenticated principal with test claims. Otherwise it
///   returns <see cref="AuthenticateResult.NoResult"/> to simulate an unauthenticated
///   request. Also supports sign-out by returning a 302 redirect.
/// </remarks>
/// <remarks>Initializes the handler with standard authentication dependencies.</remarks>
public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder), IAuthenticationSignOutHandler
{
    /// <summary>The scheme name used by this handler (<c>"cookie"</c>).</summary>
    public const string SchemeName = "cookie";

    /// <summary>Header that triggers authentication when present.</summary>
    public const string AuthenticateHeader = "X-Test-Authenticate";

    /// <summary>Authenticate the request if the test header is present.</summary>
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

    /// <summary>Handle sign-out by redirecting to the configured redirect URI.</summary>
    public Task SignOutAsync(AuthenticationProperties? properties)
    {
        var redirectUri = properties?.RedirectUri ?? "/";
        Response.StatusCode = 302;
        Response.Headers.Location = redirectUri;
        return Task.CompletedTask;
    }
}
