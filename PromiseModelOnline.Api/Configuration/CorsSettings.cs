using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Configuration;

/// <summary>Configuration options for CORS policy origins.</summary>
public class CorsSettings
{
    /// <summary>The configuration section name.</summary>
    public const string SectionName = "CorsSettings";

    /// <summary>Allowed origins for CORS, comma-separated. Falls back to APP_BASE_URL env var.</summary>
    [Required(AllowEmptyStrings = false)]
    public string AllowedOrigins { get; set; } = "https://localhost:9000";
}
