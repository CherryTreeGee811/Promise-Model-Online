using System.Threading.RateLimiting;

namespace PromiseModelOnline.Auth.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly Dictionary<string, FixedWindowRateLimiter> _limiters;

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
        _limiters = new()
        {
            ["/connect/token"] = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }),
            ["/account/register"] = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }),
            ["/account/verify-email/confirm"] = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }),
            ["/account/verify-email/resend"] = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(5),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            })
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        FixedWindowRateLimiter? limiter = null;
        foreach (var kvp in _limiters)
        {
            if (path.StartsWith(kvp.Key))
            {
                limiter = kvp.Value;
                break;
            }
        }

        if (limiter != null)
        {
            using var lease = limiter.AttemptAcquire();
            if (!lease.IsAcquired)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] = "60";
                return;
            }
        }

        await _next(context);
    }
}
