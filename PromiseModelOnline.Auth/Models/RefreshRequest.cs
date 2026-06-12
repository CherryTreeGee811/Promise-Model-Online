using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models
{
    public class RefreshRequest
    {
        [JsonPropertyName("refreshToken")]
        public string RefreshToken { get; set; } = null!;
    }
}
