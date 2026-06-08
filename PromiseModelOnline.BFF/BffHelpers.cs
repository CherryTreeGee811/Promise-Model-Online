namespace PromiseModelOnline.BFF;

public static class BffHelpers
{
    public static bool IsAjax(HttpRequest request)
    {
        return request.Headers["X-Requested-With"] == "XMLHttpRequest"
            || request.Headers.Accept.Any(value =>
                value?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true);
    }

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
