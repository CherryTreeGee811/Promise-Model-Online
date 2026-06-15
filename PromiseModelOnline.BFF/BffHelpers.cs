namespace PromiseModelOnline.BFF;

/// <summary>Helper utilities for BFF request handling and URL validation.</summary>
public static class BffHelpers
{
    /// <summary>Determine whether a request is an AJAX call from the SPA.</summary>
    /// <remarks>
    ///   Checks for the <c>X-Requested-With: XMLHttpRequest</c> header or an
    ///   <c>Accept: application/json</c> header. Used by cookie authentication
    ///   events to return 401/403 status codes instead of redirecting the SPA.
    /// </remarks>
    /// <param name="request">The HTTP request to inspect.</param>
    /// <returns><c>true</c> if the request expects a JSON response.</returns>
    public static bool IsAjax(HttpRequest request)
    {
        return request.Headers["X-Requested-With"] == "XMLHttpRequest"
            || request.Headers.Accept.Any(value =>
                value?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true);
    }

    /// <summary>Validate that a return URL is a safe local redirect target.</summary>
    /// <remarks>
    ///   Prevents open redirect attacks by rejecting URLs that do not start with a
    ///   single <c>/</c>, or that start with <c>//</c> or <c>/\</c> (protocol-relative).
    /// </remarks>
    /// <param name="returnUrl">The URL to validate.</param>
    /// <returns><c>true</c> if the URL is a safe local path.</returns>
    public static bool IsSafeLocalReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
            return false;

        if (!returnUrl.StartsWith("/", StringComparison.Ordinal))
            return false;

        if (returnUrl.StartsWith("//", StringComparison.Ordinal))
            return false;

        if (returnUrl.StartsWith("/\\", StringComparison.Ordinal))
            return false;

        return true;
    }
}
