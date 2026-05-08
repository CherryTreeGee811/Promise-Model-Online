using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.Models;

public class LogoutRequest
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }
}
