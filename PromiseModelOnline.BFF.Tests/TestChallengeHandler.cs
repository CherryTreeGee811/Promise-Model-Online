using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

/// <summary>Mock OIDC challenge handler for BFF test infrastructure.</summary>
/// <remarks>
///   Always returns <see cref="AuthenticateResult.NoResult"/> for authenticate requests,
///   simulating an unauthenticated state that triggers a challenge. The challenge
///   redirects to <c>/test-challenge</c> so tests can verify the challenge flow.
/// </remarks>
public class TestChallengeHandler : AuthenticationHandler<AuthenticationSchemeOptions>, IAuthenticationSignOutHandler
{
    /// <summary>The scheme name used by this handler (<c>"oidc"</c>).</summary>
    public const string SchemeName = "oidc";

    /// <summary>Initializes the handler with standard authentication dependencies.</summary>
    public TestChallengeHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    /// <summary>Always return NoResult to simulate an unauthenticated request.</summary>
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        => Task.FromResult(AuthenticateResult.NoResult());

    /// <summary>Redirect to a fixed test URL on challenge.</summary>
    protected override Task HandleChallengeAsync(AuthenticationProperties? properties)
    {
        Response.StatusCode = 302;
        Response.Headers.Location = "/test-challenge";
        return Task.CompletedTask;
    }

    /// <summary>Handle sign-out by redirecting to root.</summary>
    public Task SignOutAsync(AuthenticationProperties? properties)
    {
        Response.StatusCode = 302;
        Response.Headers.Location = "/";
        return Task.CompletedTask;
    }
}
