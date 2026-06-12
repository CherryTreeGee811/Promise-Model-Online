using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

public class TestChallengeHandler : AuthenticationHandler<AuthenticationSchemeOptions>, IAuthenticationSignOutHandler
{
    public const string SchemeName = "oidc";

    public TestChallengeHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        => Task.FromResult(AuthenticateResult.NoResult());

    protected override Task HandleChallengeAsync(AuthenticationProperties? properties)
    {
        Response.StatusCode = 302;
        Response.Headers.Location = "/test-challenge";
        return Task.CompletedTask;
    }

    public Task SignOutAsync(AuthenticationProperties? properties)
    {
        Response.StatusCode = 302;
        Response.Headers.Location = "/";
        return Task.CompletedTask;
    }
}
