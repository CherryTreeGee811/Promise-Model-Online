using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.BFF;

/// <summary>Maps BFF-specific endpoints: health check, login, and logout.</summary>
/// <remarks>
///   The login endpoint initiates the OIDC challenge and handles auth server
///   unavailability gracefully. The logout endpoint signs out both the cookie
///   and the OIDC session.
/// </remarks>
public static class EndpointMapping
{
    /// <summary>Register the BFF endpoints on the application.</summary>
    /// <param name="app">The web application to map endpoints onto.</param>
    public static void MapBffEndpoints(this WebApplication app)
    {
        // Health check endpoint used by load balancers and orchestrators.
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

        // Login endpoint: initiates OIDC challenge with return URL validation.
        // Returns 503 if the auth server is unavailable.
        app.MapGet("/login", async (HttpContext ctx) =>
        {
            var returnUrl = ctx.Request.Query["returnUrl"].ToString();

            if (!BffHelpers.IsSafeLocalReturnUrl(returnUrl))
                returnUrl = "/";

            try
            {
                await ctx.ChallengeAsync("oidc", new AuthenticationProperties
                {
                    RedirectUri = returnUrl
                });
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "OIDC challenge failed — auth server may not be ready");

                var env = ctx.RequestServices.GetRequiredService<IWebHostEnvironment>();
                var message = env.IsDevelopment()
                    ? "Authentication service is starting up. Please wait a moment and try again."
                    : "A temporary error occurred. Please try again.";

                ctx.Response.StatusCode = 503;
                ctx.Response.ContentType = "text/plain";
                await ctx.Response.WriteAsync(message);
            }
        });

        // Logout endpoint: signs out the BFF cookie and the OIDC session.
        app.MapGet("/logout", (HttpContext ctx) =>
        {
            var userId = ctx.User?.FindFirst("sub")?.Value
                         ?? ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? "unknown";
            var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Logout: user {UserId} signed out", userId);

            return Results.SignOut(
                new AuthenticationProperties
                {
                    RedirectUri = "/"
                },
                authenticationSchemes: new[] { "cookie", "oidc" });
        });
    }
}
