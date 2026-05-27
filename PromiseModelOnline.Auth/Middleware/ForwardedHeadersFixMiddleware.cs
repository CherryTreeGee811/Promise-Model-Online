public class ForwardedHeadersFixMiddleware
{
    private readonly RequestDelegate _next;

    public ForwardedHeadersFixMiddleware(RequestDelegate next)
    {
        _next = next;
    }

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
