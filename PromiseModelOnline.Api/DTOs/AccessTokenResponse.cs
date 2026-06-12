using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

public class AccessTokenResponse
{
    [JsonPropertyName("accessToken")]
    public string AccessToken { get; set; } = string.Empty;
}