using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.Auth.Middleware;

public class GoogleAuthErrorHandlingMiddleware(
    RequestDelegate next,
    ILogger<GoogleAuthErrorHandlingMiddleware> logger)
{
    private static readonly PathString CallbackPath = new("/signin-google");

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments(CallbackPath, StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        try
        {
            await next(context);
        }
        catch (OperationCanceledException ex)
        {
            logger.LogWarning(ex, "Google auth callback cancelled (client disconnected) for {Path}", context.Request.Path);
            RedirectToLogin(context, "Google sign-in was cancelled. Please try again.");
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Google token endpoint unreachable for {Path}", context.Request.Path);
            RedirectToLogin(context, "Unable to connect to Google. Please try again.");
        }
        catch (AuthenticationFailureException ex)
        {
            logger.LogError(ex, "Google authentication failed for {Path}", context.Request.Path);
            RedirectToLogin(context, "Google sign-in failed. Please try again.");
        }
    }

    private static void RedirectToLogin(HttpContext context, string message)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.Redirect(
            $"/account/login?error={Uri.EscapeDataString(message)}");
    }
}
