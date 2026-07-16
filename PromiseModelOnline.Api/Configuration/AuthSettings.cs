namespace PromiseModelOnline.Api.Configuration;

/// <summary>Configuration options for API registration and auth behavior.</summary>
public class AuthSettings
{
    /// <summary>The configuration section name.</summary>
    public const string SectionName = "Auth";

    /// <summary>Optional registration key for Swagger UI auto-provisioning.</summary>
    public string? RegistrationKey { get; set; }
}
