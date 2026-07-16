using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Configuration;

/// <summary>Configuration options for JWT Bearer token validation.</summary>
public class JwtSettings
{
    /// <summary>The configuration section name.</summary>
    public const string SectionName = "JwtSettings";

    /// <summary>The trusted token issuer URL. Required.</summary>
    [Required(AllowEmptyStrings = false)]
    public string Issuer { get; set; } = string.Empty;

    /// <summary>The expected audience for tokens. Required.</summary>
    [Required(AllowEmptyStrings = false)]
    public string Audience { get; set; } = string.Empty;

    /// <summary>Optional OpenID Connect metadata address. Defaults to <c>{Issuer}/.well-known/openid-configuration</c>.</summary>
    public string MetadataAddress { get; set; } = string.Empty;
}
