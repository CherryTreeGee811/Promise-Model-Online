using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models;

public class DeleteAccountRequest
{
    [JsonPropertyName("password")]
    public string? Password { get; set; }
}
