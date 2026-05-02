using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models;

public class LogoutRequest
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }
}