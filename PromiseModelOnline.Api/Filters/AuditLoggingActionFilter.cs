using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Filters;

public sealed class AuditLoggingActionFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> MutatingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    };

    private readonly ILogger<AuditLoggingActionFilter> _logger;

    public AuditLoggingActionFilter(ILogger<AuditLoggingActionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        if (!MutatingMethods.Contains(request.Method))
        {
            await next();
            return;
        }

        var utcTimestamp = DateTime.UtcNow;

        var user = context.HttpContext.User;
        var jwtSub = user.FindFirst("sub")?.Value
                 ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = user.FindFirst(ClaimTypes.Email)?.Value
              ?? user.FindFirst("email")?.Value;

        var controller = context.RouteData.Values.TryGetValue("controller", out var controllerObj)
            ? controllerObj?.ToString()
            : null;
        var action = context.RouteData.Values.TryGetValue("action", out var actionObj)
            ? actionObj?.ToString()
            : null;

        var routeValues = context.RouteData.Values
            .Where(kvp => !string.Equals(kvp.Key, "controller", StringComparison.OrdinalIgnoreCase)
                          && !string.Equals(kvp.Key, "action", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.ToString());

        var executed = await next();

        if (executed.Exception is not null && !executed.ExceptionHandled)
            return;

        var statusCode = executed.HttpContext.Response.StatusCode;
        if (statusCode < 200 || statusCode >= 300)
            return;

        _logger.LogInformation(
            "Audit: {Method} {Path} {StatusCode} Controller={Controller} Action={Action} RouteValues={RouteValues} JwtSub={JwtSub} Email={Email} Utc={UtcTimestamp}",
            request.Method,
            request.Path.Value,
            statusCode,
            controller,
            action,
            routeValues,
            jwtSub,
            email,
            utcTimestamp);
    }
}
