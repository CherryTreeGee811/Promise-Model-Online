using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.Models;

public class DeleteAccountRequest
{
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}
