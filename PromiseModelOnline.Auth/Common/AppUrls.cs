namespace PromiseModelOnline.Auth.Common;

/// <summary>Centralized URL constants for the Auth service, populated at startup from configuration.</summary>
public static class AppUrls
{
    /// <summary>Base URL of the SPA frontend (e.g. https://app.promisemodel.online).</summary>
    public static string BaseUrl { get; set; } = "";

    /// <summary>Public issuer URL used in OpenID Connect discovery (e.g. https://auth.promisemodel.online).</summary>
    public static string PublicIssuer { get; set; } = "";
}
