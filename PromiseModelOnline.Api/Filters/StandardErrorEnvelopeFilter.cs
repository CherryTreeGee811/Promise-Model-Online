using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PromiseModelOnline.Api.Filters;

/// <summary>Wraps all non-success API responses in a consistent <c>{"error":"..."}</c> JSON envelope.</summary>
/// <remarks>
///   Ensures every error response has a uniform shape for the frontend to consume.
///   Success responses (2xx) are passed through unchanged.
/// </remarks>
public class StandardErrorEnvelopeFilter : IResultFilter
{

    /// <inheritdoc />
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult objectResult)
        {
            // 2xx — pass through unchanged
            if (objectResult.StatusCode is >= 200 and < 300)
                return;

            var statusCode = objectResult.StatusCode ?? 500;

            // ValidationProblemDetails (ModelState errors)
            if (objectResult.Value is ProblemDetails problem && statusCode == 400)
            {
                var errors = new Dictionary<string, object?>();
                if (problem.Extensions.TryGetValue("errors", out var rawErrors))
                    errors["errors"] = rawErrors!;

                errors["error"] = "Validation failed.";
                context.Result = new ObjectResult(errors)
                {
                    StatusCode = statusCode,
                    ContentTypes = { "application/json; charset=utf-8" }
                };
                return;
            }

            // String message (e.g. BadRequest("message"), NotFound("message"))
            if (objectResult.Value is string message)
            {
                context.Result = new ObjectResult(new { error = message })
                {
                    StatusCode = statusCode,
                    ContentTypes = { "application/json; charset=utf-8" }
                };
                return;
            }

            // Other object results — wrap if non-success
            if (objectResult.Value is not null)
            {
                context.Result = new ObjectResult(new { error = objectResult.Value })
                {
                    StatusCode = statusCode,
                    ContentTypes = { "application/json; charset=utf-8" }
                };
                return;
            }
        }

        // StatusCodeResult (no body) — e.g. NotFoundResult, BadRequestResult, ForbidResult
        if (context.Result is StatusCodeResult statusCodeResult && statusCodeResult.StatusCode >= 400)
        {
            var message = statusCodeResult.StatusCode switch
            {
                400 => "Bad request.",
                403 => "Forbidden.",
                404 => "Resource not found.",
                405 => "Method not allowed.",
                409 => "Conflict.",
                422 => "Unprocessable entity.",
                _ => "An error occurred."
            };

            context.Result = new ObjectResult(new { error = message })
            {
                StatusCode = statusCodeResult.StatusCode,
                ContentTypes = { "application/json; charset=utf-8" }
            };
            return;
        }
    }

    /// <inheritdoc />
    public void OnResultExecuted(ResultExecutedContext context)
    {
        // Nothing to do after the result is sent
    }
}
