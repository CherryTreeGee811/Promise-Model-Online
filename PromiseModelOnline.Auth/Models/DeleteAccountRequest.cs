using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models;

/// <summary>Request body for deleting a user account.</summary>
public class DeleteAccountRequest
{
    /// <summary>The user's password for identity verification.</summary>
    [Required]
    [StringLength(128)]
    [JsonPropertyName("password")]
    public string? Password { get; set; }
}
