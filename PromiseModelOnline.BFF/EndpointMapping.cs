using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.BFF;

public static class EndpointMapping
{
    public static void MapBffEndpoints(this WebApplication app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

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

        app.MapGet("/logout", () =>
        {
            return Results.SignOut(
                new AuthenticationProperties
                {
                    RedirectUri = "/"
                },
                authenticationSchemes: new[] { "cookie", "oidc" });
        });
    }
}
