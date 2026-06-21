namespace PromiseModelOnline.Auth.Middleware;

/// <summary>Middleware that adds security-related HTTP response headers.</summary>
/// <remarks>
///   Adds <c>X-Content-Type-Options: nosniff</c>, <c>X-Frame-Options: DENY</c>,
///   <c>Strict-Transport-Security</c> (for HTTPS requests), and <c>Referrer-Policy</c> headers
///   to all responses.
/// </remarks>
/// <remarks>Initializes the middleware with the next delegate in the pipeline.</remarks>
/// <param name="next">The next delegate in the request pipeline.</param>
public class SecurityHeadersMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    /// <summary>Apply security headers to the response and invoke the next middleware.</summary>
    /// <param name="context">The HTTP context for the current request.</param>
    public async Task Invoke(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";

        if (context.Request.IsHttps)
        {
            headers["Strict-Transport-Security"] =
                "max-age=31536000; includeSubDomains";
        }

        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self'; " +
            "img-src 'self' data:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'";

        await _next(context);
    }
}
