using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.Models;

public class RefreshRequest
{
    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; } = string.Empty;
}
