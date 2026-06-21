using Microsoft.Extensions.Primitives;

namespace PromiseModelOnline.Auth.Middleware;

/// <summary>Middleware that applies <c>X-Forwarded-Host</c> and <c>X-Forwarded-Proto</c> headers to the request.</summary>
/// <remarks>
///   Required when running behind a reverse proxy (e.g., Nginx, Azure Front Door) to ensure
///   correct absolute URLs are generated for OpenID Connect redirects.
/// </remarks>
/// <remarks>Initializes the middleware with the next delegate in the pipeline.</remarks>
/// <param name="next">The next delegate in the request pipeline.</param>
public class ForwardedHeadersFixMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    /// <summary>Override the request Host and Scheme from forwarded headers if present.</summary>
    public async Task Invoke(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Forwarded-Host", out var host))
        {
            context.Request.Host = HostString.FromUriComponent(host.ToString());
        }

        if (context.Request.Headers.TryGetValue("X-Forwarded-Proto", out var proto))
        {
            context.Request.Scheme = proto.ToString();
        }

        await _next(context);
    }
}
