namespace PromiseModelOnline.Auth.Middleware;

/// <summary>Catches all unhandled exceptions, logs full details to Serilog, returns a sanitized JSON error response.</summary>
/// <remarks>No exception details or stack traces are exposed to the client — only a generic error message.</remarks>
public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    /// <summary>Invoke the middleware, catching any unhandled exceptions.</summary>
    /// <param name="context">The HTTP context for the current request.</param>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception processing {Method} {Path}",
                context.Request.Method, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync("""{"error":"Internal server error."}""");
        }
    }
}
