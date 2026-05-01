using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.Models
{
    public class TokenResponse
    {
        [JsonPropertyName("token")]
        public string? Token { get; set; }
    }
}
