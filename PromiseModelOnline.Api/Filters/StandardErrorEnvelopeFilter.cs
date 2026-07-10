using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace PromiseModelOnline.Api.Filters;

/// <summary>Wraps all non-success API responses in a consistent <c>{"error":"..."}</c> JSON envelope.</summary>
/// <remarks>
///   Uses <see cref="ContentResult"/> (not <see cref="ObjectResult"/>) to bypass content
///   negotiation, ensuring the error envelope is always returned as JSON regardless of the
///   client's <c>Accept</c> header. The same <see cref="JsonSerializerOptions"/> configured
///   for the application's controllers are used for serialization.
/// </remarks>
public class StandardErrorEnvelopeFilter(IOptions<JsonOptions> jsonOptions) : IResultFilter
{
    private readonly JsonSerializerOptions _jsonOptions = jsonOptions.Value.JsonSerializerOptions;

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
                var errors = new Dictionary<string, object?>
                {
                    ["error"] = "Validation failed."
                };
                if (problem.Extensions.TryGetValue("errors", out var rawErrors))
                    errors["errors"] = rawErrors!;

                context.Result = new ContentResult
                {
                    Content = JsonSerializer.Serialize(errors, _jsonOptions),
                    ContentType = "application/json; charset=utf-8",
                    StatusCode = statusCode
                };
                return;
            }

            // String message (e.g. BadRequest("message"), NotFound("message"))
            if (objectResult.Value is string message)
            {
                context.Result = new ContentResult
                {
                    Content = JsonSerializer.Serialize(new { error = message }, _jsonOptions),
                    ContentType = "application/json; charset=utf-8",
                    StatusCode = statusCode
                };
                return;
            }

            // Other object results — wrap if non-success
            if (objectResult.Value is not null)
            {
                context.Result = new ContentResult
                {
                    Content = JsonSerializer.Serialize(new { error = objectResult.Value }, _jsonOptions),
                    ContentType = "application/json; charset=utf-8",
                    StatusCode = statusCode
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

            context.Result = new ContentResult
            {
                Content = JsonSerializer.Serialize(new { error = message }, _jsonOptions),
                ContentType = "application/json; charset=utf-8",
                StatusCode = statusCodeResult.StatusCode
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
